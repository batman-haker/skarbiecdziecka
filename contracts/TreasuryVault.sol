// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TreasuryVault
 * @author Skarbiec Dziecka
 * @notice A vault contract for storing child's crypto savings (ETH, WBTC, USDC, etc.)
 * @dev This contract allows:
 *      - Anyone to contribute (deposit) crypto to the vault
 *      - Only the owner (parent) to withdraw after lock period
 *      - Tracking of all contributions with contributor details
 *      - Support for native ETH and ERC20 tokens
 *      - Time-locked withdrawals (configurable lock period)
 *
 * Security features:
 * - Inherits from OpenZeppelin's Ownable (access control)
 * - Uses ReentrancyGuard (prevents reentrancy attacks)
 * - Uses SafeERC20 (safe token transfers)
 * - Time lock enforcement on withdrawals
 */
contract TreasuryVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice Name of the child this treasury is for
    string public childName;

    /// @notice Birth date of the child (Unix timestamp)
    uint256 public birthDate;

    /// @notice Timestamp until which funds are locked (0 = no lock)
    uint256 public lockUntil;

    /// @notice Total number of contributions made to this treasury
    uint256 public totalContributions;

    /// @notice Struct to store information about each contribution
    struct Contribution {
        address contributor;        // Wallet address of contributor
        uint256 amount;            // Amount contributed (in wei for ETH, or token units)
        address token;             // Token address (address(0) for native ETH)
        uint256 timestamp;         // When the contribution was made
        string contributorName;    // Off-chain name (e.g., "Babcia Maria")
    }

    /// @notice Array storing all contributions
    Contribution[] public contributions;

    /// @notice Mapping to track total contributed by each address
    mapping(address => uint256) public totalContributedByAddress;

    /// @notice Mapping to track total amount per token
    mapping(address => uint256) public totalPerToken;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event Deposited(
        address indexed contributor,
        uint256 amount,
        address indexed token,
        string contributorName
    );

    event Withdrawn(
        address indexed recipient,
        uint256 amount,
        address indexed token
    );

    /*//////////////////////////////////////////////////////////////
                              MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /// @notice Ensures funds are not locked
    modifier notLocked() {
        require(lockUntil == 0 || block.timestamp >= lockUntil, "Funds are locked until maturity date");
        _;
    }

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Creates a new treasury vault for a child
     * @param _childName Name of the child
     * @param _birthDate Birth date (Unix timestamp)
     * @param _lockUntil Timestamp until which funds are locked (0 = no lock)
     * @dev The deployer becomes the owner (parent) of this vault
     */
    constructor(string memory _childName, uint256 _birthDate, uint256 _lockUntil) Ownable(msg.sender) {
        require(bytes(_childName).length > 0, "Child name cannot be empty");
        require(_birthDate <= block.timestamp, "Birth date cannot be in the future");
        require(_lockUntil == 0 || _lockUntil > block.timestamp, "Lock date must be in the future");

        childName = _childName;
        birthDate = _birthDate;
        lockUntil = _lockUntil;
    }

    /*//////////////////////////////////////////////////////////////
                          DEPOSIT FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function depositETH(string memory contributorName) external payable {
        require(msg.value > 0, "Amount must be greater than 0");
        require(bytes(contributorName).length > 0, "Contributor name required");

        contributions.push(
            Contribution({
                contributor: msg.sender,
                amount: msg.value,
                token: address(0),
                timestamp: block.timestamp,
                contributorName: contributorName
            })
        );

        totalContributions++;
        totalContributedByAddress[msg.sender] += msg.value;
        totalPerToken[address(0)] += msg.value;

        emit Deposited(msg.sender, msg.value, address(0), contributorName);
    }

    function depositToken(
        address token,
        uint256 amount,
        string memory contributorName
    ) external nonReentrant {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(contributorName).length > 0, "Contributor name required");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        contributions.push(
            Contribution({
                contributor: msg.sender,
                amount: amount,
                token: token,
                timestamp: block.timestamp,
                contributorName: contributorName
            })
        );

        totalContributions++;
        totalContributedByAddress[msg.sender] += amount;
        totalPerToken[token] += amount;

        emit Deposited(msg.sender, amount, token, contributorName);
    }

    /*//////////////////////////////////////////////////////////////
                         WITHDRAWAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function withdrawETH(uint256 amount) external onlyOwner notLocked nonReentrant {
        require(address(this).balance >= amount, "Insufficient ETH balance");

        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "ETH transfer failed");

        emit Withdrawn(owner(), amount, address(0));
    }

    function withdrawToken(address token, uint256 amount)
        external
        onlyOwner
        notLocked
        nonReentrant
    {
        require(token != address(0), "Invalid token address");
        require(
            IERC20(token).balanceOf(address(this)) >= amount,
            "Insufficient token balance"
        );

        IERC20(token).safeTransfer(owner(), amount);

        emit Withdrawn(owner(), amount, token);
    }

    function withdrawAllETH() external onlyOwner notLocked nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "ETH transfer failed");

        emit Withdrawn(owner(), balance, address(0));
    }

    function withdrawAllTokens(address token) external onlyOwner notLocked nonReentrant {
        require(token != address(0), "Invalid token address");

        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");

        IERC20(token).safeTransfer(owner(), balance);

        emit Withdrawn(owner(), balance, token);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    function getContributionsCount() external view returns (uint256) {
        return contributions.length;
    }

    function getContribution(uint256 index)
        external
        view
        returns (
            address contributor,
            uint256 amount,
            address token,
            uint256 timestamp,
            string memory contributorName
        )
    {
        require(index < contributions.length, "Index out of bounds");

        Contribution memory c = contributions[index];
        return (c.contributor, c.amount, c.token, c.timestamp, c.contributorName);
    }

    function getAllContributions() external view returns (Contribution[] memory) {
        return contributions;
    }

    function getTotalContributedBy(address contributor)
        external
        view
        returns (uint256)
    {
        return totalContributedByAddress[contributor];
    }

    function getTotalForToken(address token) external view returns (uint256) {
        return totalPerToken[token];
    }

    /// @notice Check if the treasury is currently locked
    function isLocked() external view returns (bool) {
        return lockUntil > 0 && block.timestamp < lockUntil;
    }

    /// @notice Get remaining lock time in seconds (0 if unlocked)
    function getRemainingLockTime() external view returns (uint256) {
        if (lockUntil == 0 || block.timestamp >= lockUntil) return 0;
        return lockUntil - block.timestamp;
    }

    /*//////////////////////////////////////////////////////////////
                         RECEIVE FUNCTION
    //////////////////////////////////////////////////////////////*/

    receive() external payable {
        if (msg.value > 0) {
            contributions.push(
                Contribution({
                    contributor: msg.sender,
                    amount: msg.value,
                    token: address(0),
                    timestamp: block.timestamp,
                    contributorName: "Anonymous"
                })
            );

            totalContributions++;
            totalContributedByAddress[msg.sender] += msg.value;
            totalPerToken[address(0)] += msg.value;

            emit Deposited(msg.sender, msg.value, address(0), "Anonymous");
        }
    }
}
