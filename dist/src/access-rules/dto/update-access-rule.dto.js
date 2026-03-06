"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAccessRuleDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_access_rule_dto_1 = require("./create-access-rule.dto");
class UpdateAccessRuleDto extends (0, swagger_1.PartialType)(create_access_rule_dto_1.CreateAccessRuleDto) {
}
exports.UpdateAccessRuleDto = UpdateAccessRuleDto;
//# sourceMappingURL=update-access-rule.dto.js.map