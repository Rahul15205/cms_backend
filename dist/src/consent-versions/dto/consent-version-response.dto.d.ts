import { ConsentTemplateResponseDto } from '../../consent-templates/dto/consent-template-response.dto';
export declare class ConsentVersionResponseDto {
    id: string;
    versionNumber: number;
    content: string;
    templateId: string;
    publishedBy: string;
    publishedAt: Date;
    template?: ConsentTemplateResponseDto;
}
