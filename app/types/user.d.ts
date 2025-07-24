
export type AdminUser = {
    id: string;
    email: string;
    is_email_verified: boolean;
    createdAt: string;
    // additional fields from users and addresses table
    first_name: string | null;
    last_name: string | null;
    phone_number : string | null;
    role: {
        role_id: number;
        role_name: string;
    };
}