export type UserRole = 'Customer' | 'Vendor' | 'Admin';

export type ServiceCategory = 
  | 'Catering' 
  | 'Photography' 
  | 'Venue' 
  | 'Decoration' 
  | 'Entertainment' 
  | 'Other';

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface User {
  id: string;
  email: string | null;
  emailVerified: boolean;
  phoneNumber?: string;
  phoneNumberVerified?: boolean;
  name: string;
  image?: string;
  role: UserRole;
  isActive: boolean;
  bio?: string;
  address?: Address;
  
  // Vendor-specific fields
  businessName?: string;
  businessDescription?: string;
  serviceCategory?: ServiceCategory;
  
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  name?: string;
  bio?: string;
  address?: Address;
  businessName?: string;
  businessDescription?: string;
  serviceCategory?: ServiceCategory;
  image?: string;
}

export interface AdminUserListResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: {
    customers: number;
    vendors: number;
    admins: number;
  };
}
