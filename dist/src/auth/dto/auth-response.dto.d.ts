import { UserResponseDto } from '../../users/dto/user-response.dto';
export declare class AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    user: UserResponseDto;
}
