"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateGrievanceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_grievance_dto_1 = require("./create-grievance.dto");
class UpdateGrievanceDto extends (0, swagger_1.PartialType)(create_grievance_dto_1.CreateGrievanceDto) {
}
exports.UpdateGrievanceDto = UpdateGrievanceDto;
//# sourceMappingURL=update-grievance.dto.js.map