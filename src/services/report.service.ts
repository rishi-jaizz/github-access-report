import NodeCache from 'node-cache';
import { getOrganizationRepos, getRepoCollaboratorsSafe } from './github.service';
import { logger } from '../utils/logger';

// Cache for 10 minutes
const cache = new NodeCache({ stdTTL: 600 });

interface RepoPermission {
    repo: string;
    permission: 'admin' | 'write' | 'read';
}

interface UserAccess {
    username: string;
    repositories: RepoPermission[];
}

export interface AccessReport {
    organization: string;
    total_users: number;
    total_repositories: number;
    users: UserAccess[];
}

const mapPermissions = (perms: { admin: boolean; push: boolean; pull: boolean }): 'admin' | 'write' | 'read' => {
    if (perms.admin) return 'admin';
    if (perms.push) return 'write';
    return 'read';
};

export const generateReport = async (orgName: string): Promise<AccessReport> => {
    const cacheKey = `report_${orgName}`;
    const cachedReport = cache.get<AccessReport>(cacheKey);
    
    if (cachedReport) {
        logger.info(`Returning cached report for org: ${orgName}`);
        return cachedReport;
    }

    const repos = await getOrganizationRepos(orgName);
    
    const userAccessMap = new Map<string, RepoPermission[]>();
    
    // Batch requests to avoid overwhelming Node event loop or triggering abuse mechanisms too fast.
    const batchSize = 10;
    for (let i = 0; i < repos.length; i += batchSize) {
        const batch = repos.slice(i, i + batchSize);
        await Promise.all(batch.map(async (repo) => {
            const collaborators = await getRepoCollaboratorsSafe(orgName, repo.name);
            
            for (const collab of collaborators) {
                const username = collab.login;
                const permission = mapPermissions(collab.permissions);
                
                if (!userAccessMap.has(username)) {
                    userAccessMap.set(username, []);
                }
                
                userAccessMap.get(username)!.push({
                    repo: repo.name,
                    permission: permission
                });
            }
        }));
    }

    const usersList: UserAccess[] = Array.from(userAccessMap.entries()).map(([username, repositories]) => ({
        username,
        repositories
    }));

    const report: AccessReport = {
        organization: orgName,
        total_users: usersList.length,
        total_repositories: repos.length,
        users: usersList
    };

    cache.set(cacheKey, report);
    return report;
};
