interface IUser {
    id: number;
    name: string;
}

type UserStatus = "active" | "inactive";

enum Role {
    Admin,
    User
}

class UserService {
    private users: IUser[] = [];

    constructor() {}

    getUser(id: number): IUser | undefined {
        const findUser = () => {
            return this.users.find(user => user.id === id);
        };

        return findUser();
    }
}

function createUser(name: string): IUser {
    const user: IUser = {
        id: 1,
        name
    };

    return user;
}

const calculateTotal = (a: number, b: number) => {
    return a + b;
};