// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TreasuryVault.sol";

/**
 * @title TreasuryFactory
 * @author Skarbiec Dziecka
 * @notice Factory contract for creating new TreasuryVault contracts
 * @dev This factory makes it easy to create and track treasury vaults
 *      Benefits of using a factory:
 *      1. Users don't need to deploy contracts themselves
 *      2. We can track all created treasuries
 *      3. Gas costs can be optimized
 *      4. Easier to manage and upgrade
 *
 * Usage from frontend:
 *   factoryContract.createTreasury("Zosia Kowalska", 1704067200)
 */
contract TreasuryFactory {
    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice Array of all treasury addresses created by this factory
    address[] public allTreasuries;

    /// @notice Mapping from user address to their created treasuries
    mapping(address => address[]) public userTreasuries;

    /// @notice Mapping to check if a treasury was created by this factory
    mapping(address => bool) public isTreasuryFromFactory;

    /// @notice Total number of treasuries created
    uint256 public totalTreasuriesCreated;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Emitted when a new treasury is created
     * @param treasury Address of the newly created treasury
     * @param owner Address of the treasury owner (parent)
     * @param childName Name of the child
     * @param birthDate Birth date of the child
     */
    event TreasuryCreated(
        address indexed treasury,
        address indexed owner,
        string childName,
        uint256 birthDate
    );

    /*//////////////////////////////////////////////////////////////
                          MAIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Create a new treasury vault for a child
     * @param childName Name of the child (e.g., "Zosia Kowalska")
     * @param birthDate Birth date as Unix timestamp
     * @return Address of the newly created treasury
     *
     * @dev This function:
     *      1. Creates a new TreasuryVault contract
     *      2. Transfers ownership to msg.sender
     *      3. Records the treasury in our tracking system
     *
     * Example usage:
     *   const birthDate = Math.floor(new Date('2020-01-15').getTime() / 1000);
     *   await factory.createTreasury("Zosia Kowalska", birthDate);
     */
    function createTreasury(string memory childName, uint256 birthDate)
        external
        returns (address)
    {
        require(bytes(childName).length > 0, "Child name cannot be empty");
        require(birthDate <= block.timestamp, "Birth date cannot be in the future");

        // Deploy new TreasuryVault contract
        // Note: The factory becomes the initial owner, then we transfer ownership
        TreasuryVault treasury = new TreasuryVault(childName, birthDate);

        // Transfer ownership to the creator (parent)
        treasury.transferOwnership(msg.sender);

        // Get the address of the newly created treasury
        address treasuryAddress = address(treasury);

        // Record in our tracking system
        allTreasuries.push(treasuryAddress);
        userTreasuries[msg.sender].push(treasuryAddress);
        isTreasuryFromFactory[treasuryAddress] = true;
        totalTreasuriesCreated++;

        // Emit event for off-chain tracking
        emit TreasuryCreated(treasuryAddress, msg.sender, childName, birthDate);

        return treasuryAddress;
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get all treasuries created by a specific user
     * @param user Address of the user (parent)
     * @return Array of treasury addresses
     *
     * Example: Get all treasuries for current user
     *   const treasuries = await factory.getUserTreasuries(userAddress);
     */
    function getUserTreasuries(address user)
        external
        view
        returns (address[] memory)
    {
        return userTreasuries[user];
    }

    /**
     * @notice Get the number of treasuries created by a user
     * @param user Address of the user
     * @return Number of treasuries
     */
    function getUserTreasuriesCount(address user) external view returns (uint256) {
        return userTreasuries[user].length;
    }

    /**
     * @notice Get all treasuries created by this factory
     * @return Array of all treasury addresses
     * @dev Warning: This can be gas-intensive if there are many treasuries
     *      Consider using pagination for production
     */
    function getAllTreasuries() external view returns (address[] memory) {
        return allTreasuries;
    }

    /**
     * @notice Get the total number of treasuries created
     * @return Total count
     */
    function getTotalTreasuries() external view returns (uint256) {
        return allTreasuries.length;
    }

    /**
     * @notice Check if a treasury address was created by this factory
     * @param treasury Address to check
     * @return True if created by this factory
     */
    function isFromThisFactory(address treasury) external view returns (bool) {
        return isTreasuryFromFactory[treasury];
    }

    /**
     * @notice Get a specific treasury address by index
     * @param index Index in the allTreasuries array
     * @return Treasury address
     */
    function getTreasuryAtIndex(uint256 index) external view returns (address) {
        require(index < allTreasuries.length, "Index out of bounds");
        return allTreasuries[index];
    }

    /**
     * @notice Get treasury details (for convenience)
     * @param treasuryAddress Address of the treasury
     * @return childName Name of the child
     * @return birthDate Birth date
     * @return owner Owner address
     * @return ethBalance Current ETH balance
     *
     * @dev This is a convenience function that reads data from the treasury contract
     *      Useful for displaying treasury information without multiple calls
     */
    function getTreasuryDetails(address treasuryAddress)
        external
        view
        returns (
            string memory childName,
            uint256 birthDate,
            address owner,
            uint256 ethBalance
        )
    {
        require(isTreasuryFromFactory[treasuryAddress], "Treasury not from this factory");

        TreasuryVault treasury = TreasuryVault(payable(treasuryAddress));

        childName = treasury.childName();
        birthDate = treasury.birthDate();
        owner = treasury.owner();
        ethBalance = address(treasuryAddress).balance;
    }

    /**
     * @notice Get basic stats about the factory
     * @return totalTreasuries Total number of treasuries created
     * @return totalValueLocked Total ETH locked across all treasuries (in wei)
     *
     * @dev This provides a quick overview of the platform's usage
     */
    function getFactoryStats()
        external
        view
        returns (uint256 totalTreasuries, uint256 totalValueLocked)
    {
        totalTreasuries = allTreasuries.length;

        // Calculate total ETH locked across all treasuries
        uint256 totalETH = 0;
        for (uint256 i = 0; i < allTreasuries.length; i++) {
            totalETH += allTreasuries[i].balance;
        }

        totalValueLocked = totalETH;
    }
}
