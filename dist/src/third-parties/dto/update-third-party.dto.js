"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateThirdPartyDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_third_party_dto_1 = require("./create-third-party.dto");
class UpdateThirdPartyDto extends (0, swagger_1.PartialType)(create_third_party_dto_1.CreateThirdPartyDto) {
}
exports.UpdateThirdPartyDto = UpdateThirdPartyDto;
//# sourceMappingURL=update-third-party.dto.js.map