import { ConsentDeploymentsService } from './consent-deployments.service';
import { CreateConsentDeploymentDto } from './dto/create-consent-deployment.dto';
import { UpdateConsentDeploymentDto } from './dto/update-consent-deployment.dto';
export declare class ConsentDeploymentsController {
    private readonly consentDeploymentsService;
    constructor(consentDeploymentsService: ConsentDeploymentsService);
    create(createConsentDeploymentDto: CreateConsentDeploymentDto): Promise<{
        id: string;
        versionId: string;
        applicationId: string;
        isActive: boolean;
        deployedAt: Date;
    }>;
    findAll(applicationId?: string, versionId?: string, limit?: number, offset?: number): Promise<{
        total: number;
        page: number;
        limit: number;
        data: ({
            application: {
                name: string;
            };
            version: {
                versionNumber: number;
                templateId: string;
            };
        } & {
            id: string;
            versionId: string;
            applicationId: string;
            isActive: boolean;
            deployedAt: Date;
        })[];
    }>;
    findOne(id: string): Promise<{
        application: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            tenantId: string;
            apiKey: string;
        };
        version: {
            template: {
                title: string;
            };
        } & {
            id: string;
            content: string;
            versionNumber: number;
            publishedAt: Date;
            templateId: string;
            publishedBy: string;
        };
    } & {
        id: string;
        versionId: string;
        applicationId: string;
        isActive: boolean;
        deployedAt: Date;
    }>;
    update(id: string, updateConsentDeploymentDto: UpdateConsentDeploymentDto): Promise<{
        id: string;
        versionId: string;
        applicationId: string;
        isActive: boolean;
        deployedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        versionId: string;
        applicationId: string;
        isActive: boolean;
        deployedAt: Date;
    }>;
}
