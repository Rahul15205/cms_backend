"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSlaRuleDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_sla_rule_dto_1 = require("./create-sla-rule.dto");
class UpdateSlaRuleDto extends (0, swagger_1.PartialType)(create_sla_rule_dto_1.CreateSlaRuleDto) {
}
exports.UpdateSlaRuleDto = UpdateSlaRuleDto;
//# sourceMappingURL=update-sla-rule.dto.js.map