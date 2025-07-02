pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title SentrixBank
 * @dev Decentralized banking smart contract with multi-token support
 */
contract SentrixBank is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    // Structs
    struct UserAccount {
        bool isActive;
        uint256 totalDeposits;
        uint256 lastActivity;
        mapping(address => uint256) tokenBalances;
    }

    struct Transaction {
        address user;
        address token;
        uint256 amount;
        uint256 timestamp;
        TransactionType txType;
    }

    enum TransactionType {
        DEPOSIT,
        WITHDRAWAL,
        TRANSFER
    }

    // State variables
    mapping(address => UserAccount) public userAccounts;
    mapping(address => bool) public supportedTokens;
    mapping(address => uint256) public dailyLimits;
    mapping(address => mapping(uint256 => uint256)) public dailyWithdrawals; // user => day => amount
    
    Transaction[] public transactions;
    address[] public users;
    
    uint256 public constant MAX_DAILY_LIMIT = 1000 ether;
    uint256 public constant MIN_DEPOSIT = 0.001 ether;
    uint256 public emergencyWithdrawalFee = 100; // 1%
    
    // Events
    event AccountCreated(address indexed user, uint256 timestamp);
    event Deposit(address indexed user, address indexed token, uint256 amount, uint256 timestamp);
    event Withdrawal(address indexed user, address indexed token, uint256 amount, uint256 timestamp);
    event Transfer(address indexed from, address indexed to, address indexed token, uint256 amount);
    event TokenAdded(address indexed token, uint256 dailyLimit);
    event TokenRemoved(address indexed token);
    event DailyLimitUpdated(address indexed token, uint256 newLimit);
    event EmergencyWithdrawal(address indexed user, address indexed token, uint256 amount, uint256 fee);

    // Modifiers
    modifier onlyActiveUser() {
        require(userAccounts[msg.sender].isActive, "Account not active");
        _;
    }

    modifier validToken(address token) {
        require(supportedTokens[token], "Token not supported");
        _;
    }

    modifier withinDailyLimit(address token, uint256 amount) {
        uint256 today = block.timestamp / 1 days;
        uint256 todayWithdrawals = dailyWithdrawals[msg.sender][today];
        require(
            todayWithdrawals.add(amount) <= dailyLimits[token],
            "Daily limit exceeded"
        );
        _;
    }

    constructor() {
        // Add ETH as supported token (address(0) represents ETH)
        supportedTokens[address(0)] = true;
        dailyLimits[address(0)] = MAX_DAILY_LIMIT;
    }

    /**
     * @dev Create a new user account
     */
    function createAccount() external whenNotPaused {
        require(!userAccounts[msg.sender].isActive, "Account already exists");
        
        userAccounts[msg.sender].isActive = true;
        userAccounts[msg.sender].lastActivity = block.timestamp;
        users.push(msg.sender);
        
        emit AccountCreated(msg.sender, block.timestamp);
    }

    /**
     * @dev Deposit ETH to user account
     */
    function depositETH() external payable whenNotPaused onlyActiveUser nonReentrant {
        require(msg.value >= MIN_DEPOSIT, "Deposit too small");
        
        userAccounts[msg.sender].tokenBalances[address(0)] = 
            userAccounts[msg.sender].tokenBalances[address(0)].add(msg.value);
        userAccounts[msg.sender].totalDeposits = 
            userAccounts[msg.sender].totalDeposits.add(msg.value);
        userAccounts[msg.sender].lastActivity = block.timestamp;
        
        transactions.push(Transaction({
            user: msg.sender,
            token: address(0),
            amount: msg.value,
            timestamp: block.timestamp,
            txType: TransactionType.DEPOSIT
        }));
        
        emit Deposit(msg.sender, address(0), msg.value, block.timestamp);
    }

    /**
     * @dev Deposit ERC20 tokens to user account
     */
    function depositToken(address token, uint256 amount) 
        external 
        whenNotPaused 
        onlyActiveUser 
        validToken(token) 
        nonReentrant 
    {
        require(token != address(0), "Use depositETH for ETH");
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        userAccounts[msg.sender].tokenBalances[token] = 
            userAccounts[msg.sender].tokenBalances[token].add(amount);
        userAccounts[msg.sender].lastActivity = block.timestamp;
        
        transactions.push(Transaction({
            user: msg.sender,
            token: token,
            amount: amount,
            timestamp: block.timestamp,
            txType: TransactionType.DEPOSIT
        }));
        
        emit Deposit(msg.sender, token, amount, block.timestamp);
    }

    /**
     * @dev Withdraw ETH from user account
     */
    function withdrawETH(uint256 amount) 
        external 
        whenNotPaused 
        onlyActiveUser 
        withinDailyLimit(address(0), amount)
        nonReentrant 
    {
        require(amount > 0, "Amount must be greater than 0");
        require(
            userAccounts[msg.sender].tokenBalances[address(0)] >= amount,
            "Insufficient balance"
        );
        
        userAccounts[msg.sender].tokenBalances[address(0)] = 
            userAccounts[msg.sender].tokenBalances[address(0)].sub(amount);
        userAccounts[msg.sender].lastActivity = block.timestamp;
        
        uint256 today = block.timestamp / 1 days;
        dailyWithdrawals[msg.sender][today] = 
            dailyWithdrawals[msg.sender][today].add(amount);
        
        transactions.push(Transaction({
            user: msg.sender,
            token: address(0),
            amount: amount,
            timestamp: block.timestamp,
            txType: TransactionType.WITHDRAWAL
        }));
        
        payable(msg.sender).transfer(amount);
        
        emit Withdrawal(msg.sender, address(0), amount, block.timestamp);
    }

    /**
     * @dev Withdraw ERC20 tokens from user account
     */
    function withdrawToken(address token, uint256 amount) 
        external 
        whenNotPaused 
        onlyActiveUser 
        validToken(token) 
        withinDailyLimit(token, amount)
        nonReentrant 
    {
        require(token != address(0), "Use withdrawETH for ETH");
        require(amount > 0, "Amount must be greater than 0");
        require(
            userAccounts[msg.sender].tokenBalances[token] >= amount,
            "Insufficient balance"
        );
        
        userAccounts[msg.sender].tokenBalances[token] = 
            userAccounts[msg.sender].tokenBalances[token].sub(amount);
        userAccounts[msg.sender].lastActivity = block.timestamp;
        
        uint256 today = block.timestamp / 1 days;
        dailyWithdrawals[msg.sender][today] = 
            dailyWithdrawals[msg.sender][today].add(amount);
        
        transactions.push(Transaction({
            user: msg.sender,
            token: token,
            amount: amount,
            timestamp: block.timestamp,
            txType: TransactionType.WITHDRAWAL
        }));
        
        IERC20(token).safeTransfer(msg.sender, amount);
        
        emit Withdrawal(msg.sender, token, amount, block.timestamp);
    }

    /**
     * @dev Transfer tokens between users
     */
    function transfer(address to, address token, uint256 amount) 
        external 
        whenNotPaused 
        onlyActiveUser 
        validToken(token) 
        nonReentrant 
    {
        require(to != address(0), "Invalid recipient");
        require(to != msg.sender, "Cannot transfer to self");
        require(userAccounts[to].isActive, "Recipient account not active");
        require(amount > 0, "Amount must be greater than 0");
        require(
            userAccounts[msg.sender].tokenBalances[token] >= amount,
            "Insufficient balance"
        );
        
        userAccounts[msg.sender].tokenBalances[token] = 
            userAccounts[msg.sender].tokenBalances[token].sub(amount);
        userAccounts[to].tokenBalances[token] = 
            userAccounts[to].tokenBalances[token].add(amount);
        
        userAccounts[msg.sender].lastActivity = block.timestamp;
        userAccounts[to].lastActivity = block.timestamp;
        
        transactions.push(Transaction({
            user: msg.sender,
            token: token,
            amount: amount,
            timestamp: block.timestamp,
            txType: TransactionType.TRANSFER
        }));
        
        emit Transfer(msg.sender, to, token, amount);
    }

    /**
     * @dev Emergency withdrawal with fee (only when paused)
     */
    function emergencyWithdraw(address token) external whenPaused onlyActiveUser nonReentrant {
        uint256 balance = userAccounts[msg.sender].tokenBalances[token];
        require(balance > 0, "No balance to withdraw");
        
        uint256 fee = balance.mul(emergencyWithdrawalFee).div(10000);
        uint256 withdrawAmount = balance.sub(fee);
        
        userAccounts[msg.sender].tokenBalances[token] = 0;
        
        if (token == address(0)) {
            payable(msg.sender).transfer(withdrawAmount);
            payable(owner()).transfer(fee);
        } else {
            IERC20(token).safeTransfer(msg.sender, withdrawAmount);
            IERC20(token).safeTransfer(owner(), fee);
        }
        
        emit EmergencyWithdrawal(msg.sender, token, withdrawAmount, fee);
    }

    // Admin functions
    function addSupportedToken(address token, uint256 dailyLimit) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(!supportedTokens[token], "Token already supported");
        require(dailyLimit <= MAX_DAILY_LIMIT, "Daily limit too high");
        
        supportedTokens[token] = true;
        dailyLimits[token] = dailyLimit;
        
        emit TokenAdded(token, dailyLimit);
    }

    function removeSupportedToken(address token) external onlyOwner {
        require(supportedTokens[token], "Token not supported");
        
        supportedTokens[token] = false;
        dailyLimits[token] = 0;
        
        emit TokenRemoved(token);
    }

    function updateDailyLimit(address token, uint256 newLimit) external onlyOwner {
        require(supportedTokens[token], "Token not supported");
        require(newLimit <= MAX_DAILY_LIMIT, "Daily limit too high");
        
        dailyLimits[token] = newLimit;
        
        emit DailyLimitUpdated(token, newLimit);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // View functions
    function getBalance(address user, address token) external view returns (uint256) {
        return userAccounts[user].tokenBalances[token];
    }

    function getUserInfo(address user) external view returns (
        bool isActive,
        uint256 totalDeposits,
        uint256 lastActivity
    ) {
        UserAccount storage account = userAccounts[user];
        return (account.isActive, account.totalDeposits, account.lastActivity);
    }

    function getTodayWithdrawals(address user) external view returns (uint256) {
        uint256 today = block.timestamp / 1 days;
        return dailyWithdrawals[user][today];
    }

    function getTransactionCount() external view returns (uint256) {
        return transactions.length;
    }

    function getUserCount() external view returns (uint256) {
        return users.length;
    }
}
