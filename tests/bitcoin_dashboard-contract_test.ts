
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

// Constants for testing
const CATEGORY_NAME = "Office Supplies";
const CATEGORY_BUDGET = 1000000; // 1 STX = 1000000 microSTX
const EXPENSE_DESCRIPTION = "New laptops";
const EXPENSE_AMOUNT = 500000; // 0.5 STX
const EXPENSE_NOTES = "For engineering team";
const PAYMENT_TX_HASH = "0x1234567890abcdef";

Clarinet.test({
    name: "Ensure that owner can add funds, create categories, and manage expenses",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const wallet1 = accounts.get("wallet_1")!;
        const contractName = "bitcoin_dashboard-contract";
        
        // Test adding funds
        let block = chain.mineBlock([
            Tx.contractCall(
                contractName,
                "add-funds",
                [types.uint(2000000)], // 2 STX
                deployer.address
            )
        ]);
        
        // Check receipt
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result, `(ok u2000000)`);
        assertEquals(block.height, 2);
        
        // Test adding a category
        block = chain.mineBlock([
            Tx.contractCall(
                contractName,
                "add-category",
                [
                    types.ascii(CATEGORY_NAME),
                    types.uint(CATEGORY_BUDGET)
                ],
                deployer.address
            )
        ]);
        
        // Check receipt
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result, `(ok u0)`); // First category ID is 0
        assertEquals(block.height, 3);
        
        // Test adding an expense
        block = chain.mineBlock([
            Tx.contractCall(
                contractName,
                "add-expense",
                [
                    types.ascii(EXPENSE_DESCRIPTION),
                    types.uint(EXPENSE_AMOUNT),
                    types.principal(wallet1.address),
                    types.uint(0), // Category ID
                    types.ascii(EXPENSE_NOTES)
                ],
                deployer.address
            )
        ]);
        
        // Check receipt
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result, `(ok u0)`); // First expense ID is 0
        assertEquals(block.height, 4);
        
        // Test approving an expense
        block = chain.mineBlock([
            Tx.contractCall(
                contractName,
                "approve-expense",
                [types.uint(0)], // Expense ID
                deployer.address
            )
        ]);
        
        // Check receipt
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result, `(ok true)`);
        assertEquals(block.height, 5);
        
        // Test paying an expense
        block = chain.mineBlock([
            Tx.contractCall(
                contractName,
                "pay-expense",
                [
                    types.uint(0), // Expense ID
                    types.ascii(PAYMENT_TX_HASH)
                ],
                deployer.address
            )
        ]);
        
        // Check receipt
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result, `(ok true)`);
        assertEquals(block.height, 6);
        
        // Check balance after payment
        const balanceResult = chain.callReadOnlyFn(
            contractName,
            "get-balance",
            [],
            deployer.address
        );
        assertEquals(balanceResult.result, `u1500000`); // 2 STX - 0.5 STX = 1.5 STX
        
        // Check total expenses paid
        const totalPaidResult = chain.callReadOnlyFn(
            contractName,
            "get-total-expenses-paid",
            [],
            deployer.address
        );
        assertEquals(totalPaidResult.result, `u500000`); // 0.5 STX paid
    },
});

Clarinet.test({
    name: "Ensure that non-owners cannot perform restricted actions",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const wallet1 = accounts.get("wallet_1")!;
        const contractName = "bitcoin_dashboard-contract";
        
        // Add a category first (as deployer)
        let block = chain.mineBlock([
            Tx.contractCall(
                contractName,
                "add-category",
                [
                    types.ascii(CATEGORY_NAME),
                    types.uint(CATEGORY_BUDGET)
                ],
                deployer.address
            )
        ]);
        
        // Test non-owner trying to add an expense
        block = chain.mineBlock([
            Tx.contractCall(
                contractName,
                "add-expense",
                [
                    types.ascii(EXPENSE_DESCRIPTION),
                    types.uint(EXPENSE_AMOUNT),
                    types.principal(wallet1.address),
                    types.uint(0), // Category ID
                    types.ascii(EXPENSE_NOTES)
                ],
                wallet1.address // Non-owner
            )
        ]);
        
        // Check receipt - should fail with err-owner-only (u100)
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result, `(err u100)`);
        
        // Test non-owner trying to add a category
        block = chain.mineBlock([
            Tx.contractCall(
                contractName,
                "add-category",
                [
                    types.ascii("Marketing"),
                    types.uint(CATEGORY_BUDGET)
                ],
                wallet1.address // Non-owner
            )
        ]);
        
        // Check receipt - should fail with err-owner-only (u100)
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result, `(err u100)`);
    },
});

Clarinet.test({
    name: "Ensure expense workflow functions correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const wallet1 = accounts.get("wallet_1")!;
        const contractName = "bitcoin_dashboard-contract";
        
        // Setup: Add funds, category, and expense
        let block = chain.mineBlock([
            Tx.contractCall(contractName, "add-funds", [types.uint(2000000)], deployer.address),
            Tx.contractCall(
                contractName,
                "add-category",
                [types.ascii(CATEGORY_NAME), types.uint(CATEGORY_BUDGET)],
                deployer.address
            ),
            Tx.contractCall(
                contractName,
                "add-expense",
                [
                    types.ascii(EXPENSE_DESCRIPTION),
                    types.uint(EXPENSE_AMOUNT),
                    types.principal(wallet1.address),
                    types.uint(0),
                    types.ascii(EXPENSE_NOTES)
                ],
                deployer.address
            )
        ]);
        
        // Test rejecting an expense
        block = chain.mineBlock([
            Tx.contractCall(
                contractName,
                "reject-expense",
                [
                    types.uint(0), // Expense ID
                    types.ascii("Budget constraints")
                ],
                deployer.address
            )
        ]);
        
        // Check receipt
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result, `(ok true)`);
        
        // Check expense status (should be rejected)
        const expenseResult = chain.callReadOnlyFn(
            contractName,
            "get-expense",
            [types.uint(0)],
            deployer.address
        );
        
        // Parse the result to check the status field (status 3 = rejected)
        const resultString = expenseResult.result;
        // This is a simplistic check - in a real test you might want to parse the tuple more carefully
        assertEquals(resultString.includes(`status: u3`), true);
        
        // Test adding another expense
        block = chain.mineBlock([
            Tx.contractCall(
                contractName,
                "add-expense",
                [
                    types.ascii("Office chairs"),
                    types.uint(300000), // 0.3 STX
                    types.principal(wallet1.address),
                    types.uint(0),
                    types.ascii("Ergonomic chairs for dev team")
                ],
                deployer.address
            )
        ]);
        
        // Test cancelling an expense
        block = chain.mineBlock([
            Tx.contractCall(
                contractName,
                "cancel-expense",
                [types.uint(1)], // Second expense ID
                deployer.address
            )
        ]);
        
        // Check receipt
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result, `(ok true)`);
        
        // Check expense status (should be cancelled)
        const cancelledExpenseResult = chain.callReadOnlyFn(
            contractName,
            "get-expense",
            [types.uint(1)],
            deployer.address
        );
        
        // Parse the result to check the status field (status 5 = cancelled)
        const cancelledResultString = cancelledExpenseResult.result;
        assertEquals(cancelledResultString.includes(`status: u5`), true);
    },
});

Clarinet.test({
    name: "Ensure budget tracking works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const wallet1 = accounts.get("wallet_1")!;
        const contractName = "bitcoin_dashboard-contract";
        
        // Setup: Add funds and category with small budget
        let block = chain.mineBlock([
            Tx.contractCall(contractName, "add-funds", [types.uint(2000000)], deployer.address),
            Tx.contractCall(
                contractName,
                "add-category",
                [types.ascii("Small Budget"), types.uint(400000)], // 0.4 STX budget
                deployer.address
            )
        ]);
        
        // Add expense within budget
        block = chain.mineBlock([
            Tx.contractCall(
                contractName,
                "add-expense",
                [
                    types.ascii("Small expense"),
                    types.uint(300000), // 0.3 STX
                    types.principal(wallet1.address),
                    types.uint(0),
                    types.ascii("Within budget")
                ],
                deployer.address
            )
        ]);
        
        // Approve and pay the expense
        block = chain.mineBlock([
            Tx.contractCall(
                contractName,
                "approve-expense",
                [types.uint(0)],
                deployer.address
            ),
            Tx.contractCall(
                contractName,
                "pay-expense",
                [types.uint(0), types.ascii(PAYMENT_TX_HASH)],
                deployer.address
            )
        ]);
        
        // Add expense that exceeds remaining budget
        block = chain.mineBlock([
            Tx.contractCall(
                contractName,
                "add-expense",
                [
                    types.ascii("Large expense"),
                    types.uint(200000), // 0.2 STX (over remaining 0.1 STX budget)
                    types.principal(wallet1.address),
                    types.uint(0),
                    types.ascii("Exceeds budget")
                ],
                deployer.address
            )
        ]);
        
        // Try to approve expense that would exceed budget
        block = chain.mineBlock([
            Tx.contractCall(
                contractName,
                "approve-expense",
                [types.uint(1)],
                deployer.address
            )
        ]);
        
        // Check receipt - should fail with err-budget-exceeded (u106)
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result, `(err u106)`);
    },
});
