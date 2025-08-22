import secureLocalStorage from "react-secure-storage";
import { rootlink } from "../consts/links";
import { loggedInUser } from "../state/userState";

const getToken = () => {
    return secureLocalStorage.getItem('key');
};

type CustomRequestOptions = {
    method?: string;
    data?: any;
    params?: Record<string, any>;
};

export async function customRequest(url: string, { method = 'GET', data, params }: CustomRequestOptions = {}) {
    const httpMethod = method.toUpperCase();

    let fullUrl = rootlink + url;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const fetchOptions: RequestInit = {
        method: httpMethod,
        headers,
    };

    if (httpMethod === 'GET' && params) {
        const queryString = new URLSearchParams(params).toString();
        fullUrl = `${url}?${queryString}`;
    } else if (data) {
        (fetchOptions as any).body = JSON.stringify(data);
    }

    try {
        const response = await fetch(fullUrl, fetchOptions);
        if (response.status === 401) {
            secureLocalStorage.clear();
            loggedInUser.value = null;
        }
        if (!response.ok) {
            const errorResponse = await response.json();
            return { error: errorResponse, status: response.status };
        }
        const data = await response.json();
        console.log(response.status);

        return { data, status: response.status };
    } catch (error: unknown) {
        console.error('Error during fetch:', error);

        return { error: { message: (error as Error).message }, status: 500 };
    }
}
