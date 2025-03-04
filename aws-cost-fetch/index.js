import { execSync, spawn } from 'child_process';
import { fromSSO } from '@aws-sdk/credential-provider-sso';
import { CostExplorerClient, GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const AWS_PROFILE = 'gsg-dev';
const SSO_CACHE_DIR = `${process.env.HOME}/.aws/sso/cache`;

/**
 * ✅ Check & Refresh AWS SSO Credentials
 */
async function checkAndRefreshSSO() {
    try {
        // Check if AWS SSO token cache exists
        if (!fs.existsSync(SSO_CACHE_DIR) || fs.readdirSync(SSO_CACHE_DIR).length === 0) {
            throw new Error('No SSO token found, initiating login...');
        }

        console.log('🔍 Checking existing AWS SSO token...');

        // Validate SSO credentials
        const credentialsProvider = fromSSO({ profile: AWS_PROFILE });
        await credentialsProvider();
        console.log('✅ AWS SSO token is valid.');
    } catch (error) {
        console.log('⚠️ AWS SSO token is invalid or expired. Logging in again...');
        execSync(`aws sso login --profile ${AWS_PROFILE}`, { stdio: 'inherit' });
    }
}

async function getCostData() {
    await checkAndRefreshSSO(); // Ensure SSO credentials are valid
    const client = new CostExplorerClient({ 
        region: "ap-southeast-1", 
        credentials: fromSSO({ profile: AWS_PROFILE })
    });
    const params = {
        TimePeriod: {
        Start: "2024-02-01",
        End: "2024-02-29",
        },
        Granularity: "MONTHLY",
        Metrics: ["UnblendedCost"],
        GroupBy: [
        { Type: "DIMENSION", Key: "SERVICE" }, // Group by service
        ],
    };

    try {
        const data = await client.send(new GetCostAndUsageCommand(params));
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error fetching cost data:", error);
    }
}

async function getAccumulatedCost(startDate, endDate) {
    await checkAndRefreshSSO(); // Ensure SSO credentials are valid
    const client = new CostExplorerClient({ 
        region: "ap-southeast-1", 
        credentials: fromSSO({ profile: AWS_PROFILE })
    });
    const params = {
      TimePeriod: { Start: startDate, End: endDate },
    //   Granularity: "DAILY",  // Fetch costs per day
      Granularity: "MONTHLY",  // Fetch costs per day
      Metrics: ["UnblendedCost"],  // Get actual spending
      GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }]  // Group costs by service
    };
  
    try {
      const data = await client.send(new GetCostAndUsageCommand(params));
      
      let totalCost = 0;
      let serviceBreakdown = {};
  
      data.ResultsByTime.forEach((timeEntry) => {
        timeEntry.Groups.forEach((group) => {
          const serviceName = group.Keys[0];
          const cost = parseFloat(group.Metrics.UnblendedCost.Amount);
  
          // Accumulate cost per service
          serviceBreakdown[serviceName] = (serviceBreakdown[serviceName] || 0) + cost;
          totalCost += cost;
        });
      });
  
      console.log("Total Accumulated Cost:", totalCost.toFixed(2));
      console.log("Service-wise Cost Breakdown:", serviceBreakdown);
      console.log("Total no of Services:", Object.keys(serviceBreakdown).length);
  
      return { totalCost, serviceBreakdown };
  
    } catch (error) {
      console.error("Error fetching accumulated cost:", error);
    }
}
  
// Example: Fetch granular cost for February 2024
// getCostData();

// Example: Fetch accumulated cost for February 2024
getAccumulatedCost("2025-03-01", "2025-03-04");