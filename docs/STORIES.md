# Stokard Clone - User Stories

## API Endpoints Overview

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token

### Cards
- `GET /api/v1/cards?page={page}&limit={limit}` - List all cards (paginated)
- `POST /api/v1/cards` - Create new card
- `GET /api/v1/cards/{id}` - Get specific card by ID
- `PUT /api/v1/cards/{id}` - Update existing card
- `DELETE /api/v1/cards/{id}` - Delete card

### Supported Barcode Types
- **EAN8**: 7-8 digits
- **EAN13**: 12-13 digits
- **CODE128**: ASCII characters
- **QR**: No specific validation
- **AZTEC**: No specific validation
- **PDF417**: No specific validation

---

## Epic 1: Authentication & User Management

### US-1.1: User Registration
**As a** new user
**I want to** register for an account
**So that** I can start managing my loyalty cards digitally

**API Endpoint:**
```
POST /api/v1/auth/register
```

**Request:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "plainPassword": "SecurePass123"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "message": "User registered successfully",
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "expiresIn": 900
  }
}
```

**Acceptance Criteria:**
- [x] Registration form has fields for name, email, and password
- [x] Password must be at least 8 characters with uppercase, lowercase, and number
- [x] Form shows validation errors inline
- [x] API errors are displayed to the user (409 for duplicate email, 422 for validation)
- [x] After successful registration, user is automatically logged in
- [x] Store id, email, accessToken, refreshToken in Pinia store and localStorage
- [x] User is redirected to cards list after registration

---

### US-1.2: User Login
**As a** registered user
**I want to** log into my account
**So that** I can access my saved loyalty cards

**API Endpoint:**
```
POST /api/v1/auth/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "plainPassword": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "message": "Login successful",
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "expiresIn": 900
  }
}
```

**Acceptance Criteria:**
- [x] Login form has fields for email and password
- [x] Form validates input before submission
- [x] Store id, email, accessToken, refreshToken in Pinia store and localStorage
- [x] User is redirected to cards list on successful login
- [x] Error messages are displayed for invalid credentials (401)
- [x] Previous URL is restored after login (if user was redirected)

---

### US-1.3: User Logout
**As a** logged-in user
**I want to** log out of my account
**So that** I can secure my account when done

**Acceptance Criteria:**
- [x] Logout button is visible in the app bar
- [x] Clicking logout clears all tokens from localStorage
- [x] User is redirected to login page after logout
- [x] User state is cleared from Pinia store

---

### US-1.4: Automatic Token Refresh
**As a** logged-in user
**I want** my session to refresh automatically
**So that** I don't have to log in frequently during normal usage

**API Endpoint:**
```
POST /api/v1/auth/refresh
```

**Request:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response (200 OK):**
```json
{
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "expiresIn": 900
  }
}
```

**Implementation Notes:**
- Access tokens expire after 15 minutes
- Refresh tokens expire after 7 days
- Both tokens are rotated (new tokens issued) on refresh
- Must store the new refresh token to replace the old one

**Acceptance Criteria:**
- [x] Axios interceptor catches 401 errors and triggers refresh
- [x] Refresh happens transparently without user interaction
- [x] Failed API requests are retried after token refresh
- [x] New accessToken and refreshToken replace old ones in store and localStorage
- [x] User is logged out if refresh token is invalid (401)
- [x] User is redirected to login if refresh fails

---

### US-1.5: Protected Routes
**As a** visitor
**I want** to be redirected to login when accessing protected pages
**So that** only authenticated users can access their data

**Acceptance Criteria:**
- [x] Unauthenticated users are redirected to login when accessing /cards
- [x] Authenticated users are redirected away from /login and /register
- [x] Navigation guard checks authentication state before route change
- [x] Original destination is preserved for post-login redirect

---

## Epic 2: Cards List & Overview

### US-2.1: View All Cards
**As a** logged-in user
**I want to** see a list of all my loyalty cards
**So that** I can quickly access any card I need

**API Endpoint:**
```
GET /api/v1/cards?page={page}&limit={limit}
```

**Query Parameters:**
- `page`: Page number (default: 1, minimum: 1)
- `limit`: Items per page (default: 20, min: 1, max: 100)

**Response (200 OK):**
```json
{
  "data": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "cardNumber": "1234567890123",
        "cardName": "My Loyalty Card",
        "barcodeType": "EAN13",
        "barcodeData": "1234567890123",
        "storeId": "660e8400-e29b-41d4-a716-446655440000",
        "createdAt": 1735732800,
        "updatedAt": 1735732800
      }
    ],
    "pagination": {
      "currentPage": 1,
      "perPage": 20,
      "total": 45,
      "lastPage": 3
    }
  }
}
```

**Implementation Notes:**
- Cards are sorted by creation date (newest first)
- Only returns cards owned by the authenticated user
- Returns empty array when user has no cards

**Acceptance Criteria:**
- [x] Cards are displayed in a responsive grid/list layout
- [x] Each card shows cardName (or "Unnamed Card" if null), cardNumber, and barcodeType
- [x] Empty state is shown when user has no cards (total = 0)
- [x] Loading spinner is displayed while fetching cards
- [x] Quick action buttons are available on each card (view, edit, delete)

---

### US-2.2: Pagination
**As a** logged-in user
**I want to** navigate through pages of cards
**So that** I can efficiently browse a large collection

**Acceptance Criteria:**
- [x] Pagination controls are displayed below the cards list
- [x] Current page number and total pages are shown (use pagination.currentPage and pagination.lastPage)
- [x] Next/Previous buttons work correctly
- [x] Direct page number selection is available
- [x] Pagination state persists during session
- [x] Default page size is 20 cards (can be changed up to 100)
- [x] Update URL query parameters with current page

---

### US-2.3: Navigate to Card Creation
**As a** logged-in user
**I want** a clear button to add new cards
**So that** I can easily expand my card collection

**Acceptance Criteria:**
- [x] "Add Card" button is prominently displayed
- [x] Button is accessible from cards list view
- [x] Clicking button navigates to card creation form
- [x] Button has clear icon and label

---

## Epic 3: Card Creation

### US-3.1: Create New Card
**As a** logged-in user
**I want to** add a new loyalty card
**So that** I can store it digitally instead of carrying physical cards

**API Endpoint:**
```
POST /api/v1/cards
```

**Request:**
```json
{
  "cardNumber": "1234567890123",
  "cardName": "My Store Card",
  "barcodeType": "EAN13",
  "storeId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "cardNumber": "1234567890123",
    "cardName": "My Store Card",
    "barcodeType": "EAN13",
    "barcodeData": "1234567890123",
    "storeId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": 1735732800,
    "updatedAt": 1735732800
  }
}
```

**Field Validations:**
- `cardNumber`: Required, alphanumeric with spaces/hyphens/underscores (max 255 chars)
- `cardName`: Optional (max 255 chars)
- `barcodeType`: Required, must be one of: EAN8, EAN13, CODE128, QR, AZTEC, PDF417
- `storeId`: Optional UUID v4

**Barcode Type Validation:**
- EAN8: Must be 7-8 digits
- EAN13: Must be 12-13 digits
- CODE128: Must contain only ASCII characters
- QR, AZTEC, PDF417: No specific validation

**Error Responses:**
- 422: Validation errors (invalid barcode format, missing required fields)
- 409: Duplicate card (same cardNumber and storeId for same user)

**Acceptance Criteria:**
- [x] Form has fields for card number (required), card name (optional), barcode type (required), and store ID (optional)
- [x] Barcode type dropdown includes: EAN8, EAN13, CODE128, QR, AZTEC, PDF417
- [x] Client-side validation matches API requirements (EAN8: 7-8 digits, EAN13: 12-13 digits)
- [x] Real-time barcode preview updates as user types
- [x] Success notification is shown after card creation
- [x] User is redirected to cards list after creation (detail view pending US-4.1)
- [x] API validation errors are displayed inline (422 errors)
- [x] Duplicate card error is handled gracefully (409)

---

### US-3.2: Barcode Preview During Creation
**As a** user creating a card
**I want to** see a live preview of the barcode
**So that** I can verify I entered the correct information

**Acceptance Criteria:**
- [x] Barcode preview updates in real-time as user types
- [x] Preview shows correct barcode type
- [x] Invalid barcode formats show helpful error message
- [x] Preview is responsive and properly sized

---

## Epic 4: Card Details & Viewing

### US-4.1: View Card Details
**As a** logged-in user
**I want to** view detailed information about a specific card
**So that** I can see all card information and the barcode

**API Endpoint:**
```
GET /api/v1/cards/{id}
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "cardNumber": "1234567890123",
    "cardName": "My Loyalty Card",
    "barcodeType": "EAN13",
    "barcodeData": "1234567890123",
    "storeId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": 1735732800,
    "updatedAt": 1735732800
  }
}
```

**Error Responses:**
- 404: Card not found or belongs to another user
- 401: Not authenticated

**Acceptance Criteria:**
- [x] Card detail page shows cardName (or "Unnamed Card" if null), cardNumber, barcodeType, barcodeData
- [x] Full-size barcode is prominently displayed using barcodeData and barcodeType
- [x] Barcode is rendered in high resolution for scanning
- [x] Display createdAt and updatedAt timestamps (formatted as readable dates)
- [x] Edit and delete buttons are available
- [x] Back button returns to cards list
- [x] Handle 404 errors gracefully (redirect to cards list or show error)

---

### US-4.2: Display Different Barcode Types
**As a** logged-in user
**I want** my cards to display the correct barcode type
**So that** they can be scanned at stores

**Acceptance Criteria:**
- [x] EAN8 barcodes render correctly using jsbarcode
- [x] EAN13 barcodes render correctly using jsbarcode
- [x] CODE128 barcodes render correctly using jsbarcode
- [x] QR codes render correctly using vue-qrcode-component
- [x] AZTEC and PDF417 show fallback display (text-based)
- [x] Barcode is large enough to scan from phone screen

---

### US-4.3: Copy Card Number
**As a** logged-in user
**I want to** copy the card number to clipboard
**So that** I can paste it when shopping online

**Acceptance Criteria:**
- [ ] Copy button is visible near card number
- [ ] Clicking button copies number to clipboard
- [ ] Success notification confirms copy action
- [ ] Works on mobile and desktop browsers

---

### US-4.4: Download Barcode Image
**As a** logged-in user
**I want to** download the barcode as an image
**So that** I can save or print it for offline use

**Acceptance Criteria:**
- [ ] Download button is available on card detail page
- [ ] Image downloads in high resolution (PNG or SVG)
- [ ] Downloaded file has meaningful name (e.g., cardname-barcode.png)
- [ ] Works on mobile and desktop browsers

---

## Epic 5: Card Editing

### US-5.1: Edit Existing Card
**As a** logged-in user
**I want to** edit my card information
**So that** I can correct errors or update details

**API Endpoint:**
```
PUT /api/v1/cards/{id}
```

**Request:**
```json
{
  "cardNumber": "9876543210987",
  "cardName": "Updated Card Name",
  "barcodeType": "CODE128",
  "storeId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "cardNumber": "9876543210987",
    "cardName": "Updated Card Name",
    "barcodeType": "CODE128",
    "barcodeData": "9876543210987",
    "storeId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": 1735732800,
    "updatedAt": 1735819200
  }
}
```

**Field Validations:**
- All fields are optional (can send partial updates)
- Same validation rules as create endpoint apply

**Error Responses:**
- 404: Card not found or belongs to another user
- 422: Validation errors (invalid barcode format)
- 409: Duplicate card (same cardNumber and storeId)

**Acceptance Criteria:**
- [ ] First fetch card details via GET /api/v1/cards/{id}
- [ ] Edit form is pre-filled with existing card data
- [ ] All fields can be modified except card ID
- [ ] Form has same validation as create form
- [ ] Barcode preview updates when card number or type changes
- [ ] Success notification is shown after update
- [ ] User is redirected to card detail view after update
- [ ] API validation errors are displayed inline (422 errors)
- [ ] Handle 404 errors (card not found)

---

### US-5.2: Cancel Edit
**As a** user editing a card
**I want** to cancel my changes
**So that** I can discard modifications without saving

**Acceptance Criteria:**
- [ ] Cancel button is available on edit form
- [ ] Clicking cancel discards all changes
- [ ] User is returned to card detail view
- [ ] No API call is made when canceling

---

## Epic 6: Card Deletion

### US-6.1: Delete Card
**As a** logged-in user
**I want to** delete cards I no longer need
**So that** I can keep my collection organized

**API Endpoint:**
```
DELETE /api/v1/cards/{id}
```

**Response (204 No Content):**
- No response body
- Status 204 indicates successful deletion

**Error Responses:**
- 404: Card not found or belongs to another user
- 401: Not authenticated

**Implementation Notes:**
- This is a soft delete (card is not permanently removed from database)
- Deleted cards won't appear in GET /api/v1/cards list
- Cannot retrieve deleted cards via GET /api/v1/cards/{id}

**Acceptance Criteria:**
- [ ] Delete button is available on card detail and list views
- [ ] Confirmation dialog appears before deletion
- [ ] Dialog shows cardName (or "this card") and asks for confirmation
- [ ] Card is removed from Pinia store and UI after successful deletion
- [ ] Success notification is shown after deletion
- [ ] User is redirected to cards list after deletion from detail view
- [ ] Deletion can be canceled from confirmation dialog
- [ ] Handle 404 errors gracefully

---

## Epic 7: Navigation & Layout

### US-7.1: Application Navigation
**As a** logged-in user
**I want** clear navigation between different sections
**So that** I can easily move around the application

**Acceptance Criteria:**
- [ ] App bar is displayed on all authenticated pages
- [ ] App bar shows app logo/title
- [ ] Navigation menu includes: Home, My Cards
- [ ] Current page is highlighted in navigation
- [ ] User name/email is displayed in app bar
- [ ] Logout button is easily accessible

---

### US-7.2: Responsive Design
**As a** mobile user
**I want** the application to work well on my phone
**So that** I can use it on the go

**Acceptance Criteria:**
- [ ] Application is fully functional on mobile devices
- [ ] Layout adapts to different screen sizes (phone, tablet, desktop)
- [ ] Touch targets are appropriately sized for mobile
- [ ] Navigation uses mobile-friendly drawer on small screens
- [ ] Barcodes scale appropriately on mobile screens
- [ ] Forms are easy to fill out on mobile

---

### US-7.3: Home/Dashboard View
**As a** logged-in user
**I want** a home page that provides an overview
**So that** I can quickly see my account status

**Acceptance Criteria:**
- [ ] Home page shows total number of cards
- [ ] Quick action button to view all cards
- [ ] Quick action button to add new card
- [ ] Displays user greeting with name
- [ ] Accessible from navigation menu

---

## Epic 8: Error Handling & UX

### US-8.1: Display Error Messages
**As a** user
**I want** to see clear error messages when something goes wrong
**So that** I understand what happened and can take action

**Acceptance Criteria:**
- [ ] API errors are displayed in snackbar/toast notifications
- [ ] Form validation errors are shown inline near fields
- [ ] Network errors show appropriate message
- [ ] Error messages are user-friendly and actionable
- [ ] Errors auto-dismiss after 5 seconds (snackbars)

---

### US-8.2: Loading States
**As a** user
**I want** to see when the application is processing
**So that** I know to wait for the action to complete

**Acceptance Criteria:**
- [ ] Loading spinner is shown during API calls
- [ ] Skeleton loaders are used for card list loading
- [ ] Submit buttons show loading state during form submission
- [ ] Buttons are disabled during processing to prevent double-submission
- [ ] Loading states have minimum duration to prevent flashing

---

### US-8.3: Success Notifications
**As a** user
**I want** confirmation when my actions succeed
**So that** I know the operation completed successfully

**Acceptance Criteria:**
- [ ] Success snackbar appears after card creation
- [ ] Success snackbar appears after card update
- [ ] Success snackbar appears after card deletion
- [ ] Success snackbar appears after copying to clipboard
- [ ] Notifications auto-dismiss after 3 seconds
- [ ] Notifications use consistent styling

---

### US-8.4: 404 Not Found Page
**As a** user
**I want** a helpful page when I navigate to an invalid URL
**So that** I can get back to the application

**Acceptance Criteria:**
- [ ] 404 page is shown for invalid routes
- [ ] Page explains that the page was not found
- [ ] Link to return to home or cards list is provided
- [ ] Page maintains application layout and styling

---

## Epic 9: Performance & Optimization

### US-9.1: Fast Initial Load
**As a** user
**I want** the application to load quickly
**So that** I can start using it without waiting

**Acceptance Criteria:**
- [ ] Initial page load is under 3 seconds on average connection
- [ ] Code splitting is implemented for routes
- [ ] Images and assets are optimized
- [ ] Lazy loading is used for components when appropriate

---

### US-9.2: Offline-First Considerations
**As a** mobile user
**I want** graceful handling of network issues
**So that** I understand when I'm offline

**Acceptance Criteria:**
- [ ] Network errors are clearly communicated
- [ ] Application doesn't crash on network failure
- [ ] Retry mechanisms are in place for failed requests
- [ ] User-friendly message when API is unreachable

---

## Future Enhancements (Out of Scope for MVP)

### US-F.1: Search Cards
**As a** user with many cards
**I want to** search for cards by name or store
**So that** I can quickly find a specific card

### US-F.2: Sort Cards
**As a** user
**I want to** sort cards by different criteria
**So that** I can organize them to my preference

### US-F.3: Dark Mode
**As a** user
**I want** to switch to dark mode
**So that** I can reduce eye strain in low light

### US-F.4: Export All Cards
**As a** user
**I want to** export all my cards data
**So that** I have a backup of my information

### US-F.5: Card Categories/Tags
**As a** user
**I want to** organize cards into categories
**So that** I can group related cards together

---

## Acceptance & Definition of Done

### General Definition of Done
For each user story to be considered complete:
- [ ] Feature is implemented according to acceptance criteria
- [ ] Code follows Vue 3 Composition API best practices
- [ ] Component is responsive on mobile and desktop
- [ ] Error handling is implemented
- [ ] Loading states are shown where appropriate
- [ ] Feature is manually tested in browser
- [ ] No console errors or warnings
- [ ] Code is committed with meaningful message

### MVP Completion Criteria
The MVP is complete when all user stories in Epics 1-8 are done:
- All authentication flows work (login, register, logout, token refresh)
- Users can view, create, edit, and delete cards
- Barcodes display correctly for all supported types
- Application is responsive and works on mobile devices
- Error handling and loading states are implemented
- Navigation and layout are functional and intuitive

---

## API Verification Summary

All user stories have been verified against the Stokard OpenAPI specification. Below is a summary of the verification:

### Authentication Stories (Epic 1) - ✅ Fully Supported
- **US-1.1 (Registration)**: `POST /api/v1/auth/register` - Returns id, email, accessToken, refreshToken
- **US-1.2 (Login)**: `POST /api/v1/auth/login` - Returns id, email, accessToken, refreshToken
- **US-1.3 (Logout)**: Client-side only (clear localStorage and Pinia store)
- **US-1.4 (Token Refresh)**: `POST /api/v1/auth/refresh` - Returns new accessToken and refreshToken
- **US-1.5 (Protected Routes)**: Client-side route guards using authentication state

### Cards Stories (Epics 2-6) - ✅ Fully Supported
- **US-2.1 (View All Cards)**: `GET /api/v1/cards?page={page}&limit={limit}` - Returns paginated card list
- **US-2.2 (Pagination)**: Supported via query parameters (page, limit) and pagination metadata
- **US-2.3 (Navigate to Card Creation)**: Client-side routing
- **US-3.1 (Create Card)**: `POST /api/v1/cards` - Validates barcode types, returns created card
- **US-3.2 (Barcode Preview)**: Client-side feature using jsbarcode/vue-qrcode-component
- **US-4.1 (View Card Details)**: `GET /api/v1/cards/{id}` - Returns full card details
- **US-4.2 (Display Barcodes)**: Client-side rendering using barcode libraries
- **US-4.3 (Copy Card Number)**: Client-side clipboard API
- **US-4.4 (Download Barcode)**: Client-side canvas/SVG download
- **US-5.1 (Edit Card)**: `PUT /api/v1/cards/{id}` - Updates card with validation
- **US-5.2 (Cancel Edit)**: Client-side navigation
- **US-6.1 (Delete Card)**: `DELETE /api/v1/cards/{id}` - Soft deletes card

### Navigation, Error Handling & Performance (Epics 7-9) - ✅ Fully Supported
- All stories are client-side features or best practices

### Important API Details to Note:

1. **Auth Response Structure**: The API returns `id` and `email` as separate fields, NOT nested in a `user` object. Update the Pinia store accordingly.

2. **Token Expiration**:
   - Access tokens: 15 minutes (900 seconds)
   - Refresh tokens: 7 days
   - Both tokens are rotated on refresh - always store the new refresh token!

3. **Card Fields**:
   - `cardName` and `storeId` are optional (can be null)
   - `barcodeData` is automatically generated from `cardNumber` by the API
   - `createdAt` and `updatedAt` are Unix timestamps

4. **Error Codes**:
   - 401: Unauthorized (invalid/expired token)
   - 404: Not found
   - 409: Conflict (duplicate email/card)
   - 422: Validation error

5. **Barcode Validation**:
   - EAN8: 7-8 digits only
   - EAN13: 12-13 digits only
   - CODE128: ASCII characters
   - QR, AZTEC, PDF417: No specific validation

### Conclusion
All 27 MVP user stories can be fully implemented using the available API endpoints. No additional backend endpoints are required for the MVP.

---

**Last Updated:** November 7, 2025
**Total User Stories:** 27 (MVP) + 5 (Future)
**Status:** Ready for Development
**API Compatibility:** ✅ Verified against stokard-open-api.json