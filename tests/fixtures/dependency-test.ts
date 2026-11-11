interface IUserService {
    getUser(): string;
}

class BaseService {
    log() {
        return "Logged";
    }
}

class UserService extends BaseService implements IUserService {
    getUser() {
        this.log();
        return "Sepehr";
    }
}

function startApp() {
    const service = new UserService();
    service.getUser();
}
