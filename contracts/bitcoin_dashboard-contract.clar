
;; bitcoin_dashboard-contract
;; Contract for managing bitcoin expenses and stacks funds with categories

;; constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-insufficient-funds (err u102))
(define-constant err-invalid-status (err u105))
(define-constant err-invalid-amount (err u107))

;; expense status constants
(define-constant status-pending u1)
(define-constant status-approved u2)
(define-constant status-rejected u3)
(define-constant status-paid u4)
(define-constant status-cancelled u5)

;; data maps and vars
(define-map expenses 
  { expense-id: uint } 
  { 
    description: (string-ascii 256),
    amount: uint,
    status: uint,
    recipient: principal,
    category-id: uint,
    created-by: principal,
    created-at: uint,
    last-modified: uint,
    notes: (string-ascii 512)
  }
)

(define-map expense-categories
  { category-id: uint }
  {
    name: (string-ascii 64),
    budget: uint,
    active: bool
  }
)

(define-data-var expense-counter uint u0)
(define-data-var category-counter uint u0)
(define-data-var total-balance uint u0)
(define-data-var total-expenses-paid uint u0)
(define-data-var total-expenses-pending uint u0)

;; private functions
(define-private (is-owner)
  (is-eq tx-sender contract-owner)
)

(define-private (get-current-time)
  block-height
)

;; public functions
(define-public (add-funds (amount uint))
  (begin
    (asserts! (> amount u0) err-invalid-amount)
    (var-set total-balance (+ (var-get total-balance) amount))
    (ok (var-get total-balance))
  )
)

(define-public (add-expense (description (string-ascii 256)) (amount uint) (recipient principal) (category-id uint) (notes (string-ascii 512)))
  (let (
    (expense-id (var-get expense-counter))
    (current-time (get-current-time))
    (category (map-get? expense-categories { category-id: category-id }))
  )
    (begin
      (asserts! (is-owner) err-owner-only)
      (asserts! (> amount u0) err-invalid-amount)
      (asserts! (not (is-none category)) err-not-found)
      (asserts! (get active (unwrap! category err-not-found)) err-not-found)
      
      (map-set expenses 
        { expense-id: expense-id } 
        { 
          description: description, 
          amount: amount, 
          status: status-pending, 
          recipient: recipient,
          category-id: category-id,
          created-by: tx-sender,
          created-at: current-time,
          last-modified: current-time,
          notes: notes
        }
      )
      (var-set expense-counter (+ expense-id u1))
      (var-set total-expenses-pending (+ (var-get total-expenses-pending) amount))
      (ok expense-id)
    )
  )
)

(define-public (approve-expense (expense-id uint))
  (let (
    (expense (unwrap! (map-get? expenses { expense-id: expense-id }) err-not-found))
    (current-time (get-current-time))
  )
    (begin
      (asserts! (is-owner) err-owner-only)
      (asserts! (is-eq (get status expense) status-pending) err-invalid-status)
      
      (map-set expenses 
        { expense-id: expense-id }
        (merge expense { 
          status: status-approved,
          last-modified: current-time
        })
      )
      (ok true)
    )
  )
)

(define-public (pay-expense (expense-id uint))
  (let (
    (expense (unwrap! (map-get? expenses { expense-id: expense-id }) err-not-found))
    (current-balance (var-get total-balance))
    (current-time (get-current-time))
  )
    (begin
      (asserts! (is-owner) err-owner-only)
      (asserts! (is-eq (get status expense) status-approved) err-invalid-status)
      (asserts! (>= current-balance (get amount expense)) err-insufficient-funds)
      
      (map-set expenses 
        { expense-id: expense-id }
        (merge expense { 
          status: status-paid,
          last-modified: current-time
        })
      )
      (var-set total-balance (- current-balance (get amount expense)))
      (var-set total-expenses-paid (+ (var-get total-expenses-paid) (get amount expense)))
      (var-set total-expenses-pending (- (var-get total-expenses-pending) (get amount expense)))
      (as-contract (stx-transfer? (get amount expense) tx-sender (get recipient expense)))
    )
  )
)

(define-public (add-category (name (string-ascii 64)) (budget uint))
  (let (
    (category-id (var-get category-counter))
  )
    (begin
      (asserts! (is-owner) err-owner-only)
      (var-set category-counter (+ category-id u1))
      (map-set expense-categories
        { category-id: category-id }
        {
          name: name,
          budget: budget,
          active: true
        }
      )
      (ok category-id)
    )
  )
)

;; read-only functions
(define-read-only (get-expense (expense-id uint))
  (map-get? expenses { expense-id: expense-id })
)

(define-read-only (get-category (category-id uint))
  (map-get? expense-categories { category-id: category-id })
)

(define-read-only (get-balance)
  (var-get total-balance)
)

(define-read-only (get-total-expenses-paid)
  (var-get total-expenses-paid)
)

(define-read-only (get-total-expenses-pending)
  (var-get total-expenses-pending)
)

