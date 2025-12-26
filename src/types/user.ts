export type UserRole = 'admin' | 'central_office' | 'city_staff' | 'supplier';

export interface User {
    id: string;
    email: string;
    role: UserRole;
    full_name: string | null;
    city: string | null;
    supplier_name: string | null;
    product_types: string[] | null;
    is_active: boolean;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}
