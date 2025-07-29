# Sui 💧<->🦄 Fusion+ 

This repository implements the integration of [1inch Fusion+](https://1inch.io/fusion/) with the [Sui](https://sui.io/) blockchain, offering the following features:

- **Cross-Chain Swaps**: Seamless intent-based swaps on liquidity across different blockchains.
- **Non-custodial**: Based on HTLCs, funds are not held by third parties during swaps.
- **Timelock protection**: If the swap is not completed within the designated time, the funds are returned to their original owners.
- **MEV Protection**: Protection against front-running and sandwich attacks.
- **Competitive Pricing**: Resolvers compete to execute swaps at the most favorable rates, through a Dutch auction model.
- **Partial Fills**: Swaps can be filled in parts by multiple resolvers.
- **Gasless Transactions**: Gas fees are covered by the resolvers who fill the swap.
- **No Cross-Chain Messaging**: Swaps settled through cryptographic commitments rather than bridge-based message passing.

## License

This project is licensed under the [BSD 3-Clause License](LICENSE).

---

**Disclaimer**: This software is provided "as is" without warranty. Users should conduct their own research and due diligence before using this integration. 
Developed during the ETHGlobal Unite DeFi Hackathon.