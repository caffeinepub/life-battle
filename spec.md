# Life Battle

## Current State
Full Free Fire tournament platform with player/admin app, match system, leaderboard, wallet (basic balance + tx history), and room ID/password system. Backend has Player, Match, WalletTransaction types with authorization.

## Requested Changes (Diff)

### Add
- DepositRequest type: player submits amount, UPI transaction ID, screenshot upload; goes to admin for approval
- WithdrawRequest type: player submits UPI ID and amount (from winning balance only); goes to admin for approval
- Admin endpoints: getDepositRequests, approveDepositRequest, rejectDepositRequest, getWithdrawRequests, approveWithdrawRequest, rejectWithdrawRequest
- Player endpoints: submitDepositRequest, submitWithdrawRequest, getPlayerDepositRequests, getPlayerWithdrawRequests
- winningBalance field on Player (separate from walletBalance; prizes credit here; withdrawals only from winningBalance)
- Wallet page: Deposit button with amount selector (₹10/50/100/200/500), QR code display with 3-minute countdown timer, transaction ID input, upload screenshot instruction, submit button
- Wallet page: Withdraw button with UPI ID input and amount (only from winning balance)
- Wallet page: performance stats (kills, matches, wins)
- Admin wallet management: approve/reject deposit and withdraw requests

### Modify
- WalletPage: full redesign with deposit/withdraw flows, performance stats section, wallet message
- Player type: add winningBalance field
- setMatchResult: credit prize to winnerName player's winningBalance
- Admin dashboard: add deposit/withdraw request management sections

### Remove
- Nothing removed

## Implementation Plan
1. Update backend main.mo: add DepositRequest, WithdrawRequest types, winningBalance to Player, all new endpoints
2. Update frontend WalletPage with full deposit/withdraw UI, QR code image, 3-minute timer, stats
3. Update AdminDashboardPage with deposit/withdraw approval panels
