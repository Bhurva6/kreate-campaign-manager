# Enterprise Onboarding Feature

This feature allows enterprise users to complete an onboarding process and create a customized brand kit page.

## Overview

The Enterprise Onboarding process consists of:

1. A multi-step form to collect company information:
   - Company name and website
   - Industry and company size
   - Brand colors and preferences

2. Enterprise Dashboard that includes:
   - Company overview with key details
   - Brand kit with color palette and design previews
   - Settings page to edit company information

## Implementation Details

### Files Created:

- `/src/app/enterprise/page.tsx` - Main enterprise page
- `/src/components/EnterpriseOnboarding.tsx` - Multi-step onboarding form
- `/src/components/EnterpriseDashboard.tsx` - Dashboard with brand kit
- `/src/app/api/enterprise-data/route.ts` - API endpoint for enterprise data (placeholder)

### How It Works:

1. Users access the `/enterprise` route
2. If they haven't completed onboarding, they see the form
3. After completing the form, they see their customized dashboard
4. The dashboard shows their brand kit with their company's colors and styling

### Current Implementation Notes:

- Data is currently stored in localStorage for demo purposes
- In a production environment, this should be connected to Firebase
- The form validates inputs and provides a live preview

## Future Enhancements

- Add ability to upload company logos and brand assets
- Implement team member invitations and permissions
- Connect to Firebase for persistent data storage
- Add more customization options for the brand kit
