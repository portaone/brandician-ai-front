# Brandician.AI Application Blueprint

## Overview

Brandician.AI is a React-based web application that helps users create and manage brand identities through an AI-driven process. The application guides users through various stages of brand development, from initial questionnaires to final brand asset generation.

## Architecture

### Technology Stack

- **Frontend Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Build Tool**: Vite

### Core Components

The application is organized into several key areas:

1. **Authentication**
   - `LoginForm`: Handles user login with email/OTP
     - Manages email input and OTP verification
     - Integrates with auth store for login state
     - Handles error states and loading indicators
     - Provides navigation to registration
   
   - `RegisterForm`: New user registration
     - Multi-step registration process
     - Email and profile information collection
     - OTP verification integration
     - Success state handling
   
   - `AuthGuard`: Protected route wrapper
     - Checks authentication state
     - Redirects unauthorized users
     - Handles loading states
     - Maintains session persistence

2. **Brand Management**
   - `BrandList`: Displays user's brands
     - Grid layout of brand cards
     - Status indicators and progress tracking
     - Navigation to brand-specific workflows
     - Empty state handling
   
   - `CreateBrand`: New brand creation
     - Simple form for initial brand setup
     - Validation and error handling
     - Success state and redirect logic
   
   - `ExplanationScreen`: Process overview
     - Step-by-step process explanation
     - Visual progress indicators
     - Call-to-action for next steps

3. **Brand Development Process**
   - `QuestionnaireContainer`: Brand discovery
     - Question rendering and navigation
     - Voice input integration
     - Progress tracking
     - Answer validation and storage
     - Summary view generation
   
   - `JTBDContainer`: Jobs-to-be-Done analysis
     - Persona management
     - Importance rating system
     - Functional drivers input
     - Multi-step workflow
   
   - `SurveyContainer`: Survey creation
     - Multiple question types
     - Dynamic form building
     - Preview functionality
     - Distribution link generation

4. **Common Components**
   - `TopMenu`: Navigation header
     - User profile management
     - Navigation links
     - Responsive design
     - Authentication state display
   
   - `ProgressBar`: Progress tracking
     - Visual progress indication
     - Animated transitions
     - Status labeling

### Component Interaction Patterns

1. **State Management Integration**
   ```typescript
   // Example of component-store interaction
   const MyComponent: React.FC = () => {
     const { data, actions } = useStore();
     
     useEffect(() => {
       // Initialize component data
       actions.loadData();
     }, []);
     
     return (
       // Component rendering
     );
   };
   ```

2. **Inter-component Communication**
   ```typescript
   // Parent-child communication
   const Parent: React.FC = () => {
     const handleAction = (data: ActionData) => {
       // Handle child component action
     };
     
     return <Child onAction={handleAction} />;
   };
   ```

3. **Error Handling Pattern**
   ```typescript
   const ComponentWithError: React.FC = () => {
     const [error, setError] = useState<Error | null>(null);
     
     if (error) {
       return <ErrorDisplay error={error} />;
     }
     
     return (
       // Normal component rendering
     );
   };
   ```

### Adding New Components

1. **Component Structure**
   ```typescript
   // ComponentName.tsx
   interface ComponentProps {
     // Props definition
   }
   
   const ComponentName: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
     // State management
     const [state, setState] = useState();
     
     // Effects
     useEffect(() => {
       // Component lifecycle management
     }, [dependencies]);
     
     // Event handlers
     const handleEvent = () => {
       // Event handling logic
     };
     
     return (
       // JSX structure
     );
   };
   ```

2. **Integration with Stores**
   ```typescript
   // Using existing stores
   const ComponentWithStore: React.FC = () => {
     const { data, actions } = useBrandStore();
     // Component implementation
   };
   ```

3. **Styling Guidelines**
   ```typescript
   // Tailwind class organization
   const StyledComponent: React.FC = () => {
     return (
       <div className="
         // Layout classes
         flex flex-col
         // Spacing
         p-4 space-y-2
         // Colors
         bg-white text-neutral-800
         // Interactive states
         hover:bg-neutral-50
         // Responsive design
         md:flex-row md:space-x-4
       ">
         {/* Component content */}
       </div>
     );
   };
   ```

### State Management

The application uses Zustand for state management with two main stores:

1. `authStore`: Manages authentication state and user data
2. `brandStore`: Handles brand-related state and operations

### Routing Structure

```
/
├── /login
├── /register
├── /brands
│   ├── /new
│   └── /:brandId
│       ├── /explanation
│       ├── /questionnaire
│       ├── /summary
│       ├── /jtbd
│       ├── /survey
│       └── /strategy
```

## Brand Development Flow

1. **Initial Setup** (`new_brand` status)
   - User creates a new brand
   - Views explanation screen

2. **Questionnaire** (`questionnaire` status)
   - User answers brand discovery questions
   - Can use voice input or text

3. **Summary** (`summary` status)
   - Review and edit brand summary
   - AI-generated insights

4. **JTBD Analysis** (`jtbd` status)
   - Define customer personas
   - Set importance levels
   - Add functional drivers

5. **Survey Creation** (`create_survey` status)
   - Create customer validation survey
   - Multiple question types supported

6. **Strategy** (`strategy` status)
   - Review and finalize brand strategy

7. **Identity** (`identity` status)
   - Generate brand assets
   - Final brand package

## Adding New Features

### Component Guidelines

1. **File Structure**
   ```
   src/components/
   ├── FeatureName/
   │   ├── FeatureContainer.tsx
   │   ├── FeatureItem.tsx
   │   └── index.ts
   ```

2. **State Management**
   - Add new state slices to existing stores or create new stores if needed
   - Follow the existing pattern in `src/store`

3. **API Integration**
   - Add new API endpoints to `src/lib/api.ts`
   - Follow the existing error handling patterns

4. **Routing**
   - Add new routes in `App.tsx`
   - Update `navigation.ts` if adding new brand stages

### Best Practices

1. **Component Design**
   - Use TypeScript interfaces for props
   - Implement error boundaries
   - Follow existing styling patterns with Tailwind

2. **State Management**
   - Keep state updates immutable
   - Use selectors for derived state
   - Implement proper error handling

3. **Performance**
   - Implement proper loading states
   - Use React.memo for expensive renders
   - Optimize re-renders with proper dependencies

4. **Error Handling**
   - Implement proper error boundaries
   - Show user-friendly error messages
   - Log errors appropriately

### Testing New Features

1. Create test files alongside components
2. Test main user flows
3. Include error cases
4. Test responsive design

## Deployment

The application includes Docker support for containerized deployment:

- Uses multi-stage build
- Optimized for production
- Configurable through environment variables

### Environment Variables

```
VITE_API_URL=http://localhost:8000
VITE_DEBUG=false
```

## Contributing

1. Follow the existing code style
2. Update documentation when adding features
3. Test thoroughly before submitting changes
4. Update the blueprint document as needed