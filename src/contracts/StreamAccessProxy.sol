// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./StreamAccessContract.sol";

/**
 * @title StreamAccessProxy
 * @dev Implements an ERC1967 proxy for the StreamAccessContract
 * The proxy delegates calls to the implementation contract
 */
contract StreamAccessProxy is ERC1967Proxy {
    constructor(
        address _logic,
        bytes memory _data
    ) ERC1967Proxy(_logic, _data) {}
}

/**
 * @title StreamAccessProxyAdmin
 * @dev Admin contract for managing proxy upgrades
 * Uses the built-in proxy admin pattern from OpenZeppelin
 */
contract StreamAccessProxyAdmin is Ownable {
    /**
     * @dev Upgrades an ERC1967 proxy to a new implementation
     * @param proxy Address of the proxy to upgrade
     * @param implementation Address of the new implementation
     */
    function upgradeProxy(address proxy, address implementation) external onlyOwner {
        // Call the upgradeTo function on the proxy
        (bool success, bytes memory data) = proxy.call(
            abi.encodeWithSignature("upgradeTo(address)", implementation)
        );
        require(success, "Upgrade failed");
    }
}

/**
 * @title StreamAccessDeployer
 * @dev Helper contract to deploy the full proxy setup using the UUPS pattern
 * Use this contract for initial deployment and upgrades
 */
contract StreamAccessDeployer {
    address public accessContract;
    address public proxyAdmin;
    address public proxy;

    event Deployed(address accessContract, address proxyAdmin, address proxy);

    /**
     * @dev Deploy the full proxy setup
     * @param _name Name for the StreamToken
     * @param _symbol Symbol for the StreamToken
     * @return _proxy Address of the deployed proxy
     */
    function deploy(string memory _name, string memory _symbol) external returns (address _proxy) {
        // Deploy the implementation contract
        StreamAccessContract impl = new StreamAccessContract();
        accessContract = address(impl);

        // Deploy the proxy admin
        StreamAccessProxyAdmin admin = new StreamAccessProxyAdmin();
        proxyAdmin = address(admin);

        // Prepare initialization data
        bytes memory data = abi.encodeWithSelector(
            StreamAccessContract(address(0)).initialize.selector,
            _name,
            _symbol
        );

        // Deploy the proxy using ERC1967 and UUPS pattern
        StreamAccessProxy proxyContract = new StreamAccessProxy(
            accessContract,
            data
        );
        proxy = address(proxyContract);

        // Transfer ownership of proxy admin to the deployer
        admin.transferOwnership(msg.sender);

        emit Deployed(accessContract, proxyAdmin, proxy);
        return proxy;
    }

    /**
     * @dev Deploy a new implementation and upgrade the proxy using the UUPS pattern
     * @param _proxy Address of the proxy to upgrade
     * @return _newImplementation Address of the new implementation
     */
    function upgrade(address _proxy) external returns (address _newImplementation) {
        require(_proxy != address(0), "Invalid proxy address");

        // Deploy the new implementation
        StreamAccessContract newImpl = new StreamAccessContract();
        address newImplAddress = address(newImpl);

        // Get the proxy interface
        StreamAccessProxyAdmin admin = StreamAccessProxyAdmin(proxyAdmin);

        // Upgrade the proxy using the admin contract
        admin.upgradeProxy(_proxy, newImplAddress);

        return newImplAddress;
    }
}
