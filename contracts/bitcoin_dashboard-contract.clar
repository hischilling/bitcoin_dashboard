
;; bitcoin_dashboard-contract
;; Basic contract for managing bitcoin expenses and stacks funds

;; constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-insufficient-funds (err u102))
(define-constant err-invalid-amount (err u107))

;; data maps and vars
(define-map expenses 
  { expense-id: uint } 
  { 
    description: (string-ascii 256),
    amount: uint,
    paid: bool,
    recipient: principal,
    created-at: uint
  }
)

(define-data-var expense-counter uint u0)
(define-data-var total-balance uint u0)

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

(define-public (add-expense (description (string-ascii 256)) (amount uint) (recipient principal))
  (let (
    (expense-id (var-get expense-counter))
    (current-time (get-current-time))
  )
    (begin
      (asserts! (is-owner) err-owner-only)
      (asserts! (> amount u0) err-invalid-amount)
      
      (map-set expenses 
        { expense-id: expense-id } 
        { 
          description: description, 
          amount: amount, 
          paid: false, 
          recipient: recipient,
          created-at: current-time
        }
      )
      (var-set expense-counter (+ expense-id u1))
      (ok expense-id)
    )
  )
)

(define-public (pay-expense (expense-id uint))
  (let (
    (expense (unwrap! (map-get? expenses { expense-id: expense-id }) err-not-found))
    (current-balance (var-get total-balance))
  )
    (begin
      (asserts! (is-owner) err-owner-only)
      (asserts! (>= current-balance (get amount expense)) err-insufficient-funds)
      (asserts! (not (get paid expense)) err-not-found)
      
      (map-set expenses 
        { expense-id: expense-id }
        (merge expense { paid: true })
      )
      (var-set total-balance (- current-balance (get amount expense)))
      (as-contract (stx-transfer? (get amount expense) tx-sender (get recipient expense)))
    )
  )
)

;; read-only functions
(define-read-only (get-expense (expense-id uint))
  (map-get? expenses { expense-id: expense-id })
)

(define-read-only (get-balance)
  (var-get total-balance)
)

