function getName() {
    return "Sepehr";
}

class BaseService {
    log() {
        return "Logged";
    }
}

class UserService extends BaseService {
    findUser() {
        return getName();
    }

    getUser() {
        this.log();
        return this.findUser();
    }
}

function startApp() {
    const service = new UserService();
    service.getUser();
}
