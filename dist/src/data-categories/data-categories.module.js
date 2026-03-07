"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataCategoriesModule = void 0;
const common_1 = require("@nestjs/common");
const data_categories_service_1 = require("./data-categories.service");
const data_categories_controller_1 = require("./data-categories.controller");
let DataCategoriesModule = class DataCategoriesModule {
};
exports.DataCategoriesModule = DataCategoriesModule;
exports.DataCategoriesModule = DataCategoriesModule = __decorate([
    (0, common_1.Module)({
        controllers: [data_categories_controller_1.DataCategoriesController],
        providers: [data_categories_service_1.DataCategoriesService],
    })
], DataCategoriesModule);
//# sourceMappingURL=data-categories.module.js.map