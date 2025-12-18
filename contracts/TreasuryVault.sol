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
 *      - Only the owner (parent) to withdraw
 *      - Tracking of all contributions with contributor details
 *      - Support for native ETH and ERC20 tokens
 *
 * Security features:
 * - Inherits from OpenZeppelin's Ownable (access control)
 * - Uses ReentrancyGuard (prevents reentrancy attacks)
 * - Uses SafeERC20 (safe token transfers)
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

    /**
     * @notice Emitted when someone makes a contribution
     * @param contributor Address of the contributor
     * @param amount Amount contributed
     * @param token Token address (address(0) for ETH)
     * @param contributorName Off-chain name of contributor
     */
    event Deposited(
        address indexed contributor,
        uint256 amount,
        address indexed token,
        string contributorName
    );

    /**
     * @notice Emitted when the owner withdraws funds
     * @param recipient Address receiving the funds (owner)
     * @param amount Amount withdrawn
     * @param token Token address (address(0) for ETH)
     */
    event Withdrawn(
        address indexed recipient,
        uint256 amount,
        address indexed token
    );

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Creates a new treasury vault for a child
     * @param _childName Name of the child
     * @param _birthDate Birth date (Unix timestamp)
     * @dev The deployer becomes the owner (parent) of this vault
     */
    constructor(string memory _childName, uint256 _birthDate) Ownable(msg.sender) {
        require(bytes(_childName).length > 0, "Child name cannot be empty");
        require(_birthDate <= block.timestamp, "Birth date cannot be in the future");

        childName = _childName;
        birthDate = _birthDate;
    }

    /*//////////////////////////////////////////////////////////////
                          DEPOSIT FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deposit native ETH to the treasury
     * @param contributorName Off-chain name of contributor (e.g., "Wujek Tomasz")
     * @dev Anyone can call this function to contribute
     *      The ETH is sent with the transaction as msg.value
     *
     * Example usage from frontend:
     *   contract.depositETH("Babcia Anna", { value: ethers.parseEther("0.1") })
     */
    function depositETH(string memory contributorName) external payable {
        require(msg.value > 0, "Amount must be greater than 0");
        require(bytes(contributorName).length > 0, "Contributor name required");

        // Create contribution record
        contributions.push(
            Contribution({
                contributor: msg.sender,
                amount: msg.value,
                token: address(0), // address(0) represents native ETH
                timestamp: block.timestamp,
                contributorName: contributorName
            })
        );

        // Update totals
        totalContributions++;
        totalContributedByAddress[msg.sender] += msg.value;
        totalPerToken[address(0)] += msg.value;

        emit Deposited(msg.sender, msg.value, address(0), contributorName);
    }

    /**
     * @notice Deposit ERC20 tokens (WBTC, USDC, etc.) to the treasury
     * @param token Address of the ERC20 token contract
     * @param amount Amount of tokens to deposit
     * @param contributorName Off-chain name of contributor
     * @dev The contributor must first approve this contract to spend their tokens
     *
     * Example usage from frontend:
     *   1. First: tokenContract.approve(treasuryAddress, amount)
     *   2. Then: treasuryContract.depositToken(tokenAddress, amount, "Ciocia Ewa")
     */
    function depositToken(
        address token,
        uint256 amount,
        string memory contributorName
    ) external nonReentrant {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(contributorName).length > 0, "Contributor name required");

        // Transfer tokens from contributor to this contract
        // SafeERC20 will revert if the transfer fails
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Create contribution record
        contributions.push(
            Contribution({
                contributor: msg.sender,
                amount: amount,
                token: token,
                timestamp: block.timestamp,
                contributorName: contributorName
            })
        );

        // Update totals
        totalContributions++;
        totalContributedByAddress[msg.sender] += amount;
        totalPerToken[token] += amount;

        emit Deposited(msg.sender, amount, token, contributorName);
    }

    /*//////////////////////////////////////////////////////////////
                         WITHDRAWAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Withdraw ETH from the treasury (only owner can call)
     * @param amount Amount of ETH to withdraw (in wei)
     * @dev Only the parent (owner) can withdraw funds
     *
     * Example: withdrawETH(ethers.parseEther("1.0")) // Withdraw 1 ETH
     */
    function withdrawETH(uint256 amount) external onlyOwner nonReentrant {
        require(address(this).balance >= amount, "Insufficient ETH balance");

        // Transfer ETH to owner
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "ETH transfer failed");

        emit Withdrawn(owner(), amount, address(0));
    }

    /**
     * @notice Withdraw ERC20 tokens from the treasury (only owner can call)
     * @param token Address of the token to withdraw
     * @param amount Amount of tokens to withdraw
     * @dev Only the parent (owner) can withdraw funds
     */
    function withdrawToken(address token, uint256 amount)
        external
        onlyOwner
        nonReentrant
    {
        require(token != address(0), "Invalid token address");
        require(
            IERC20(token).balanceOf(address(this)) >= amount,
            "Insufficient token balance"
        );

        // Transfer tokens to owner
        IERC20(token).safeTransfer(owner(), amount);

        emit Withdrawn(owner(), amount, token);
    }

    /**
     * @notice Emergency withdraw all ETH (only owner)
     * @dev Use with caution - withdraws entire balance
     */
    function withdrawAllETH() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "ETH transfer failed");

        emit Withdrawn(owner(), balance, address(0));
    }

    /**
     * @notice Emergency withdraw all tokens (only owner)
     * @param token Address of the token to withdraw
     */
    function withdrawAllTokens(address token) external onlyOwner nonReentrant {
        require(token != address(0), "Invalid token address");

        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");

        IERC20(token).safeTransfer(owner(), balance);

        emit Withdrawn(owner(), balance, token);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get the current ETH balance of the treasury
     * @return Current ETH balance in wei
     */
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get the current token balance of the treasury
     * @param token Address of the token
     * @return Current token balance
     */
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @notice Get the total number of contributions
     * @return Number of contributions
     */
    function getContributionsCount() external view returns (uint256) {
        return contributions.length;
    }

    /**
     * @notice Get details of a specific contribution
     * @param index Index of the contribution in the array
     * @return contributor Address of the contributor
     * @return amount Amount contributed
     * @return token Token address (address(0) for ETH)
     * @return timestamp When the contribution was made
     * @return contributorName Off-chain name of contributor
     */
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

    /**
     * @notice Get all contributions (useful for frontend)
     * @return Array of all contributions
     * @dev Be careful with gas costs if there are many contributions
     *      Consider pagination for large arrays
     */
    function getAllContributions() external view returns (Contribution[] memory) {
        return contributions;
    }

    /**
     * @notice Get how much a specific address has contributed in total
     * @param contributor Address to check
     * @return Total amount contributed by this address
     */
    function getTotalContributedBy(address contributor)
        external
        view
        returns (uint256)
    {
        return totalContributedByAddress[contributor];
    }

    /**
     * @notice Get total amount of a specific token held
     * @param token Token address to check
     * @return Total amount of this token
     */
    function getTotalForToken(address token) external view returns (uint256) {
        return totalPerToken[token];
    }

    /*//////////////////////////////////////////////////////////////
                         RECEIVE FUNCTION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Allow contract to receive ETH directly (without calling depositETH)
     * @dev This is useful if someone sends ETH directly to the contract
     *      However, we won't track the contributor name in this case
     */
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
