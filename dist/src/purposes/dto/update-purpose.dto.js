"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePurposeDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_purpose_dto_1 = require("./create-purpose.dto");
class UpdatePurposeDto extends (0, swagger_1.PartialType)(create_purpose_dto_1.CreatePurposeDto) {
}
exports.UpdatePurposeDto = UpdatePurposeDto;
//# sourceMappingURL=update-purpose.dto.js.map