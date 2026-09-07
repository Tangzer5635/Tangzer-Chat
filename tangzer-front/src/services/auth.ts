export interface LoginResponse {
    token: string;
}

export async function login(
    username: string,
    password: string
): Promise<string> {

    const response = await fetch(
        "http://172.16.64.192:8080/auth/login/",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                password,
            }),
        }
    );

    if (!response.ok) {
        throw new Error("Identifiants incorrects");
    }

    const data: LoginResponse = await response.json();

    localStorage.setItem("jwt", data.token);

    return data.token;
}

export function getToken(): string | null {
    return localStorage.getItem("jwt");
}

export function logout() {
    localStorage.removeItem("jwt");
}