"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThirdPartiesModule = void 0;
const common_1 = require("@nestjs/common");
const third_parties_service_1 = require("./third-parties.service");
const third_parties_controller_1 = require("./third-parties.controller");
let ThirdPartiesModule = class ThirdPartiesModule {
};
exports.ThirdPartiesModule = ThirdPartiesModule;
exports.ThirdPartiesModule = ThirdPartiesModule = __decorate([
    (0, common_1.Module)({
        controllers: [third_parties_controller_1.ThirdPartiesController],
        providers: [third_parties_service_1.ThirdPartiesService],
    })
], ThirdPartiesModule);
//# sourceMappingURL=third-parties.module.js.map