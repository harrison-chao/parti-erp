"use server";

import { db } from "@/db";
import { dealerApplications, dealers, dealerAddresses, dealerApplicationStatusEnum } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { generateDocNo } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "./rbac";

// Submit dealer application (public - no auth required)
export async function submitDealerApplication(data: {
  companyName: string;
  businessLicense?: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contactPosition?: string;
  priceTierRequested?: "A" | "B" | "C";
  settlementMethodRequested?: "prepaid" | "deposit" | "credit";
  expectedMonthlyVolume?: string;
  mainBusiness?: string;
  referralSource?: string;
}) {
  try {
    // Check if email already exists
    const existing = await db.select()
      .from(dealerApplications)
      .where(eq(dealerApplications.contactEmail, data.contactEmail))
      .limit(1);

    if (existing.length > 0) {
      return { 
        success: false, 
        error: "该邮箱已提交申请，请耐心等待审核或使用其他邮箱" 
      };
    }

    const [application] = await db.insert(dealerApplications)
      .values({
        ...data,
        status: "pending",
      })
      .returning();

    return { success: true, data: application };
  } catch (error) {
    console.error("Failed to submit dealer application:", error);
    return { success: false, error: "提交申请失败" };
  }
}

// Get all dealer applications (admin/manager only)
export async function getDealerApplications(params?: {
  status?: "pending" | "reviewing" | "approved" | "rejected";
  page?: number;
  limit?: number;
}) {
  try {
    if (!(await hasPermission(PERMISSIONS.DEALERS_READ))) {
      return { success: false, error: "Unauthorized" };
    }

    const { status, page = 1, limit = 20 } = params || {};
    
    const query = db.select().from(dealerApplications);
    
    if (status) {
      const applications = await query
        .where(eq(dealerApplications.status, status))
        .orderBy(desc(dealerApplications.createdAt))
        .limit(limit)
        .offset((page - 1) * limit);
      return { success: true, data: applications };
    }
    
    const applications = await query
      .orderBy(desc(dealerApplications.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);
    

    
    if (status) {
      query = query.where(eq(dealerApplications.status, status));
    }
    
    const applications = await query
      .orderBy(desc(dealerApplications.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return { success: true, data: applications };
  } catch (error) {
    console.error("Failed to get dealer applications:", error);
    return { success: false, error };
  }
}

// Get single dealer application
export async function getDealerApplication(id: string) {
  try {
    if (!(await hasPermission(PERMISSIONS.DEALERS_READ))) {
      return { success: false, error: "Unauthorized" };
    }

    const [application] = await db.select()
      .from(dealerApplications)
      .where(eq(dealerApplications.id, id))
      .limit(1);

    if (!application) {
      return { success: false, error: "Application not found" };
    }

    return { success: true, data: application };
  } catch (error) {
    console.error("Failed to get dealer application:", error);
    return { success: false, error };
  }
}

// Update application status
export async function updateApplicationStatus(
  id: string,
  status: "reviewing" | "approved" | "rejected",
  reviewNotes?: string
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!(await hasPermission(PERMISSIONS.DEALERS_APPROVE))) {
      return { success: false, error: "Unauthorized" };
    }

    const [application] = await db.select()
      .from(dealerApplications)
      .where(eq(dealerApplications.id, id))
      .limit(1);

    if (!application) {
      return { success: false, error: "Application not found" };
    }

    let dealerId = null;

    // If approved, create dealer record
    if (status === "approved") {
      const dealerIdStr = await generateDocNo("PARTI-D");
      
      const [dealer] = await db.insert(dealers).values({
        dealerId: dealerIdStr,
        companyName: application.companyName,
        businessLicense: application.businessLicense,
        contactPerson: application.contactName,
        contactPhone: application.contactPhone,
        contactEmail: application.contactEmail,
        contactPosition: application.contactPosition,
        priceTier: application.priceTierRequested || "C",
        settlementMethod: application.settlementMethodRequested || "prepaid",
        creditLimit: 0,
        creditBalance: 0,
      }).returning();

      dealerId = dealer.id;
    }

    await db.update(dealerApplications)
      .set({
        status,
        reviewNotes,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        dealerId,
        updatedAt: new Date(),
      })
      .where(eq(dealerApplications.id, id));

    return { success: true, data: { dealerId } };
  } catch (error) {
    console.error("Failed to update application status:", error);
    return { success: false, error };
  }
}

// Get application statistics
export async function getApplicationStats() {
  try {
    if (!(await hasPermission(PERMISSIONS.DEALERS_READ))) {
      return { success: false, error: "Unauthorized" };
    }

    const allApps = await db.select().from(dealerApplications);
    
    const stats = {
      pending: allApps.filter(a => a.status === "pending").length,
      reviewing: allApps.filter(a => a.status === "reviewing").length,
      approved: allApps.filter(a => a.status === "approved").length,
      rejected: allApps.filter(a => a.status === "rejected").length,
      total: allApps.length,
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error("Failed to get application stats:", error);
    return { success: false, error };
  }
}
