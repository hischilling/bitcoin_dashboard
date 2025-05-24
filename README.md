# Bitcoin Dashboard Smart Contract

A Clarity smart contract for managing Bitcoin expenses with budget tracking and workflow capabilities, built on the Stacks blockchain.

## Overview

Bitcoin Dashboard is a financial management tool designed to help organizations track, approve, and manage expenses paid in Bitcoin (via STX tokens on the Stacks blockchain). The contract provides a complete workflow from expense creation to payment, with budget tracking and categorization.

## Features

- **Expense Management**: Create, approve, reject, pay, and cancel expenses
- **Budget Tracking**: Set budgets per category and track spending
- **Categorization**: Organize expenses by customizable categories
- **Workflow**: Full expense lifecycle with status tracking
- **Financial Reporting**: Track total balance, pending expenses, and paid expenses
- **Access Control**: Owner-based permissions for sensitive operations

## Contract Structure

The contract is organized into several key components:

1. **Data Storage**:
   - Expenses with metadata (description, amount, recipient, status, etc.)
   - Categories with budgets
   - Monthly spending tracking
   - Global counters and totals

2. **Core Functions**:
   - `add-funds`: Add STX tokens to the contract balance
   - `add-expense`: Create a new expense request
   - `approve-expense`: Approve a pending expense
   - `reject-expense`: Reject a pending expense
   - `pay-expense`: Pay an approved expense
   - `cancel-expense`: Cancel a pending or approved expense
   - `add-category`: Create a new expense category

3. **Read-Only Functions**:
   - `get-expense`: Retrieve expense details
   - `get-category`: Retrieve category details
   - `get-balance`: Get current contract balance
   - `get-total-expenses-paid`: Get total paid expenses
   - `get-total-expenses-pending`: Get total pending expenses

## Expense Workflow

Expenses follow a defined workflow:
1. **Creation**: Expense is created with "pending" status
2. **Approval/Rejection**: Owner approves or rejects the expense
3. **Payment**: Approved expenses can be paid, transferring STX to the recipient
4. **Cancellation**: Pending or approved expenses can be cancelled

## Development

### Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet): Clarity development environment
- [Stacks CLI](https://github.com/blockstack/stacks.js): For deployment and interaction

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/bitcoin_dashboard.git
   cd bitcoin_dashboard
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run tests:
   ```
   clarinet test
   ```

### Deployment

#### Devnet

1. Start a local Devnet:
   ```
   clarinet integrate
   ```

2. Deploy the contract:
   ```
   clarinet deploy --devnet
   ```

#### Testnet/Mainnet

1. Configure your deployment settings in `settings/Testnet.toml` or `settings/Mainnet.toml`

2. Deploy to Testnet:
   ```
   clarinet deploy --testnet
   ```

3. Or deploy to Mainnet:
   ```
   clarinet deploy --mainnet
   ```

## Usage Examples

### Adding a Category

```clarity
(contract-call? .bitcoin_dashboard-contract add-category "Office Supplies" u1000000)
```

### Creating an Expense

```clarity
(contract-call? .bitcoin_dashboard-contract add-expense "New laptops" u500000 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM u1 "For engineering team")
```

### Approving an Expense

```clarity
(contract-call? .bitcoin_dashboard-contract approve-expense u1)
```

### Paying an Expense

```clarity
(contract-call? .bitcoin_dashboard-contract pay-expense u1 "tx-hash-reference")
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request