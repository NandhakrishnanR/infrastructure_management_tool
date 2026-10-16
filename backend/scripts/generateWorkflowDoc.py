"""
InfraPilot — Comprehensive End-to-End Workflow Specification & Execution Document Generator
Generates both Microsoft Word (.docx) and PDF (.pdf) formats with professional typography,
tables, diagrams, callout blocks, and deep technical workflow specifications.
"""

import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Preformatted
)
from reportlab.pdfgen import canvas

DOCS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../docs'))
DOCX_PATH = os.path.join(DOCS_DIR, 'InfraPilot_Workflow_Document.docx')
PDF_PATH = os.path.join(DOCS_DIR, 'InfraPilot_Workflow_Document.pdf')

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')

def set_cell_shading(cell, color_hex):
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def generate_docx():
    print("[DOCX] Generating Comprehensive Workflow Document (.docx)...")
    doc = Document()
    
    for s in doc.sections:
        s.top_margin = Inches(1)
        s.bottom_margin = Inches(1)
        s.left_margin = Inches(1)
        s.right_margin = Inches(1)

    NAVY = RGBColor(15, 23, 42)      # #0F172A
    BLUE = RGBColor(37, 99, 235)     # #2563EB
    SLATE = RGBColor(71, 85, 105)    # #475569
    DARK_GRAY = RGBColor(30, 41, 59) # #1E293B

    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = DARK_GRAY

    # Title Block
    p_pre = doc.add_paragraph()
    p_pre.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_pre = p_pre.add_run("ENTERPRISE IT APPLICATION ARCHITECTURE SPECIFICATION\n")
    r_pre.font.size = Pt(10)
    r_pre.font.bold = True
    r_pre.font.color.rgb = BLUE

    r_title = p_pre.add_run("InfraPilot: End-to-End Workflow & Orchestration Guide")
    r_title.font.size = Pt(24)
    r_title.font.bold = True
    r_title.font.color.rgb = NAVY

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = p_sub.add_run("Detailed Technical Specification of Request Lifecycles, Quota Gating, BullMQ Orchestration, Terraform Sandboxing, and Fleet Governance\n")
    r_sub.font.size = Pt(12)
    r_sub.font.italic = True
    r_sub.font.color.rgb = SLATE

    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_meta = p_meta.add_run("Candidate: Senior IT Application Developer  |  Document Version: 1.0.0  |  Status: Verified")
    r_meta.font.size = Pt(9.5)
    r_meta.font.color.rgb = SLATE

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    def add_h1(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(18)
        h.paragraph_format.space_after = Pt(6)
        r = h.add_run(text)
        r.font.size = Pt(16)
        r.font.bold = True
        r.font.color.rgb = NAVY
        return h

    def add_h2(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(4)
        r = h.add_run(text)
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.color.rgb = BLUE
        return h

    def add_callout(text, title="WORKFLOW PRINCIPLE"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        set_cell_shading(cell, "EFF6FF")
        set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
        p = cell.paragraphs[0]
        r1 = p.add_run(f"📌 {title}: ")
        r1.font.bold = True
        r1.font.color.rgb = BLUE
        r2 = p.add_run(text)
        r2.font.color.rgb = DARK_GRAY
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 1. Executive Summary & Workflow Objectives
    add_h1("1. Enterprise Workflow Overview & Architecture Topology")
    doc.add_paragraph(
        "InfraPilot is an enterprise self-service infrastructure management platform that orchestrates the complete "
        "lifecycle of virtual machine provisioning. In modern enterprise IT environments, development velocity is frequently "
        "stifled by manual ticket queues, while central IT teams struggle to prevent cloud cost overruns and security drift. "
        "InfraPilot resolves this operational dilemma by automating the entire provisioning pipeline through a secure, "
        "asynchronous workflow engine."
    )
    doc.add_paragraph(
        "The platform architecture separates interactive web operations from long-running infrastructure tasks by combining "
        "an Express.js REST API with an autonomous BullMQ background worker powered by Redis and HashiCorp Terraform."
    )
    add_callout(
        "Decoupled Asynchronous Processing: The web API never blocks on infrastructure operations. When an administrator approves "
        "a request, an atomic database transaction enqueues a job into Redis BullMQ and returns an immediate HTTP response. "
        "The background worker handles Terraform execution independently, ensuring high availability and zero gateway timeouts.",
        title="CORE ARCHITECTURAL PRINCIPLE"
    )

    # 2. Sequence Workflow Diagram
    add_h1("2. End-to-End Sequence & Swimlane Workflow")
    doc.add_paragraph(
        "The diagram below details the 14-step end-to-end execution flow across all seven architectural components:"
    )

    seq_diag = (
        "+-------------+     +------------+     +----------------+     +------------+     +---------------+     +---------------+     +---------------+\n"
        "|  DEVELOPER  |     |  REACT UI  |     | EXPRESS API v1 |     | POSTGRESQL |     | REDIS BULLMQ  |     | BG WORKER     |     | TERRAFORM CLI |\n"
        "+-------------+     +------------+     +----------------+     +------------+     +---------------+     +---------------+     +---------------+\n"
        "       |                   |                   |                     |                   |                     |                     |\n"
        " 1. Fill VM Form --------->|                   |                     |                   |                     |                     |\n"
        "       |            2. POST /requests -------->|                     |                   |                     |                     |\n"
        "       |                   |            3. Check Quotas ------------>|                   |                     |                     |\n"
        "       |                   |            4. INSERT Request (PENDING)->|                   |                     |                     |\n"
        "       |                   |<----------- 201 Created ----------------|                   |                     |                     |\n"
        "       |                   |                   |                     |                   |                     |                     |\n"
        " [ADMIN REVIEW]            |                   |                     |                   |                     |                     |\n"
        " Admin clicks 'Approve' -->|                   |                     |                   |                     |                     |\n"
        "       |            5. POST /approve --------->|                     |                   |                     |                     |\n"
        "       |                   |            6. BEGIN TRANSACTION ------->|                   |                     |                     |\n"
        "       |                   |               - Status -> APPROVED      |                   |                     |                     |\n"
        "       |                   |               - Create Job (QUEUED)     |                   |                     |                     |\n"
        "       |                   |               - Append Audit Log        |                   |                     |                     |\n"
        "       |                   |            7. COMMIT TRANSACTION ------>|                   |                     |                     |\n"
        "       |                   |            8. Enqueue Job --------------------------------->|                     |                     |\n"
        "       |                   |<----------- 200 OK (Job Enqueued) ------|                   |                     |                     |\n"
        "       |                   |                   |                     |                   |                     |                     |\n"
        "       |                   |                   |                     |                   | 9. Atomic Pop Job ->|                     |\n"
        "       |                   |                   |                     |                   |                     | 10. Run Validate -->|\n"
        "       |                   |                   |                     |<--- Stage: VALIDATING ------------------|                     |\n"
        "       |                   |                   |                     |                   |                     | 11. Run Plan ------>|\n"
        "       |                   |                   |                     |<--- Stage: PLANNING --------------------|                     |\n"
        "       |                   |                   |                     |                   |                     | 12. Run Apply ----->|\n"
        "       |                   |                   |                     |                   |                     |<--- JSON Outputs ---|\n"
        "       |                   |                   |                     | 13. TRANSACTION --+-------------------->|                     |\n"
        "       |                   |                   |                     |    - Insert VirtualMachine (ACTIVE)     |                     |\n"
        "       |                   |                   |                     |    - Job -> COMPLETED                   |                     |\n"
        "       |                   |                   |                     |    - Append Audit Event                 |                     |\n"
        " 14. View Live VM <--------+-------------------|                     |                   |                     |                     |\n"
        "+-------------+     +------------+     +----------------+     +------------+     +---------------+     +---------------+     +---------------+"
    )

    p_code = doc.add_paragraph()
    r_code = p_code.add_run(seq_diag)
    r_code.font.name = 'Consolas'
    r_code.font.size = Pt(7.5)

    # 3. Request Initiation & Quota Gating Workflow
    add_h1("3. Request Initiation & Quota Gating Workflow")
    doc.add_paragraph(
        "When a developer submits an infrastructure request, the request passes through a two-tiered validation barrier:"
    )

    add_h2("Tier 1: Zod Schema Constraint Validation")
    doc.add_paragraph(
        "The HTTP request payload is strictly parsed and sanitized against pre-configured system bounds. "
        "Requests containing zero CPU cores, negative RAM, non-whitelisted operating systems, or empty justification strings "
        "are rejected before database querying occurs."
    )

    schema_tbl = doc.add_table(rows=1, cols=4)
    schema_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    s_hdrs = schema_tbl.rows[0].cells
    s_hdrs[0].text = "Parameter"
    s_hdrs[1].text = "Allowed Range / Values"
    s_hdrs[2].text = "Validation Rule"
    s_hdrs[3].text = "Enforcement Mechanism"
    for c in s_hdrs:
        set_cell_shading(c, "1E293B")
        for p in c.paragraphs:
            for r in p.runs:
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)

    s_data = [
        ("cpu", "1 to 64 cores", "Integer >= 1, <= 64", "Zod number().int().min(1).max(64)"),
        ("ramMb", "1,024 MB (1GB) to 262,144 MB (256GB)", "Integer >= 1024", "Zod number().int().min(1024)"),
        ("diskGb", "10 GB to 4,096 GB (4TB)", "Integer >= 10", "Zod number().int().min(10)"),
        ("operatingSystem", "Ubuntu 22.04 LTS, Debian 12, RHEL 9, Windows Server 2022", "String whitelist", "Zod enum constraint"),
        ("environment", "DEVELOPMENT, STAGING, PRODUCTION", "String whitelist", "Zod enum constraint"),
        ("justification", "Minimum 10 characters", "Detailed text", "Zod string().min(10)")
    ]
    for param, allowed, rule, mech in s_data:
        rc = schema_tbl.add_row().cells
        rc[0].text = param
        rc[0].paragraphs[0].runs[0].font.bold = True
        rc[1].text = allowed
        rc[2].text = rule
        rc[3].text = mech
        for cell in rc:
            set_cell_margins(cell, top=70, bottom=70, left=90, right=90)

    add_h2("Tier 2: Server-Side Resource Quota Gating Algorithm")
    doc.add_paragraph(
        "Each user is bound to a ResourceQuota record. Before accepting a request into PENDING_APPROVAL, the server calculates "
        "the user's currently committed resources by summing all active virtual machines and all currently pending requests:"
    )

    calc_formula = (
        "Committed_CPU = SUM(active_vms.cpu) + SUM(pending_requests.cpu)\n"
        "Committed_RAM = SUM(active_vms.ramMb) + SUM(pending_requests.ramMb)\n"
        "Committed_Disk = SUM(active_vms.diskGb) + SUM(pending_requests.diskGb)\n"
        "Committed_VMs = COUNT(active_vms) + COUNT(pending_requests)\n\n"
        "IF (Committed_CPU + requested.cpu > quota.maxCpu) -> REJECT WITH HTTP 400 (Quota Exceeded)\n"
        "IF (Committed_RAM + requested.ramMb > quota.maxRamMb) -> REJECT WITH HTTP 400 (Quota Exceeded)\n"
        "IF (Committed_Disk + requested.diskGb > quota.maxDiskGb) -> REJECT WITH HTTP 400 (Quota Exceeded)\n"
        "IF (Committed_VMs + 1 > quota.maxVms) -> REJECT WITH HTTP 400 (Quota Exceeded)"
    )
    p_f = doc.add_paragraph()
    rf = p_f.add_run(calc_formula)
    rf.font.name = 'Consolas'
    rf.font.size = Pt(8.5)

    # 4. State Machine Lifecycle
    add_h1("4. The 8-State Finite State Machine (FSM) Lifecycle")
    doc.add_paragraph(
        "To guarantee complete transactional integrity and prevent duplicate infrastructure provisioning, InfraPilot "
        "enforces a strict state machine implemented in StatusTransitionService. Requests can only transition between "
        "formally authorized states:"
    )

    fsm_tbl = doc.add_table(rows=1, cols=4)
    fsm_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    f_hdrs = fsm_tbl.rows[0].cells
    f_hdrs[0].text = "Source State"
    f_hdrs[1].text = "Allowed Targets"
    f_hdrs[2].text = "Authorized Actor"
    f_hdrs[3].text = "Trigger Event & Side Effect"
    for c in f_hdrs:
        set_cell_shading(c, "2563EB")
        for p in c.paragraphs:
            for r in p.runs:
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)

    fsm_data = [
        ("DRAFT", "PENDING_APPROVAL, CANCELLED", "Developer", "Developer submits or cancels draft. Quota evaluated."),
        ("PENDING_APPROVAL", "APPROVED, REJECTED, CANCELLED", "Administrator / Dev", "Admin decision or requester cancellation. On APPROVE, job created."),
        ("APPROVED", "PROVISIONING, FAILED", "Background Worker", "Worker pops job from BullMQ. Status moves to PROVISIONING."),
        ("PROVISIONING", "ACTIVE, FAILED", "Terraform Engine", "Terraform apply completes successfully -> ACTIVE. Execution error -> FAILED."),
        ("ACTIVE", "DECOMMISSIONED", "Developer / Admin", "Instance decommissioned. Quotas freed in real-time."),
        ("FAILED", "PROVISIONING, CANCELLED", "Administrator", "Manual retry re-queues job to BullMQ. Cancellation frees quota."),
        ("REJECTED", "None (Terminal State)", "System", "Terminal audit record. Reserved quota commitment is released."),
        ("CANCELLED", "None (Terminal State)", "System", "Terminal audit record. Reserved quota commitment is released."),
        ("DECOMMISSIONED", "None (Terminal State)", "System", "Terminal audit record. VM record archived.")
    ]
    for src, tgt, act, trig in fsm_data:
        rc = fsm_tbl.add_row().cells
        rc[0].text = src
        rc[0].paragraphs[0].runs[0].font.bold = True
        rc[1].text = tgt
        rc[2].text = act
        rc[3].text = trig
        for cell in rc:
            set_cell_margins(cell, top=70, bottom=70, left=90, right=90)

    # 5. Governance & Approval Workflow
    add_h1("5. Administrative Governance & Approval Workflow")
    doc.add_paragraph(
        "InfraPilot implements enterprise-grade dual-control governance ensuring separation of duties:"
    )
    doc.add_paragraph(
        "• Separation of Duties: Developers can never approve requests (HTTP 403 Forbidden).\n"
        "• Anti-Self-Approval: Administrators cannot approve requests that they personally submitted.\n"
        "• Double-Approval Prevention: If two administrators attempt to approve the same request concurrently, the database "
        "row-lock checks the status. The second approval is rejected with HTTP 400 ('Only PENDING_APPROVAL requests can be approved').\n"
        "• Mandatory Justification: Every decision requires an administrative comment persisted to the Approval audit entity."
    )

    # 6. Asynchronous BullMQ & Redis Job Processing
    add_h1("6. Asynchronous BullMQ & Redis Job Processing Workflow")
    doc.add_paragraph(
        "Infrastructure operations (planning, cloud API calls, local file writes) take between 5 and 90 seconds. "
        "Executing these operations inside an Express HTTP handler would exhaust server sockets, cause reverse proxy timeouts (HTTP 504), "
        "and prevent real-time progress monitoring."
    )
    doc.add_paragraph(
        "InfraPilot isolates all infrastructure automation into a dedicated BullMQ worker process backed by Redis 7:"
    )
    doc.add_paragraph(
        "1. Job Payload Serialization: The API serializes the request ID, specifications, and execution run ID into a JSON job payload.\n"
        "2. Exponential Backoff Retries: The queue is configured with 3 retry attempts and exponential delay (1000ms base multiplier).\n"
        "3. Atomic Job Dispatch: Redis ensures that jobs are delivered to exactly one worker instance even in scaled-out container environments.\n"
        "4. Real-Time Status Streaming: As the worker progresses through Terraform stages, it writes progress updates directly to the database, enabling real-time polling by the frontend dashboard."
    )

    # 7. Terraform Sandbox Execution Workflow
    add_h1("7. Terraform Sandbox Execution Workflow")
    doc.add_paragraph(
        "The background worker invokes HashiCorp Terraform inside a strictly controlled, isolated execution sandbox:"
    )

    add_h2("The 4-Stage Execution Pipeline")
    tf_stages = [
        ("Stage 1: Sandbox Initialization", "The worker dynamically creates a dedicated workspace directory (/runs/<jobId>). It writes a terraform.tfvars.json file containing the request parameters (VM name, CPU, RAM, disk, OS)."),
        ("Stage 2: Validation", "The worker executes 'terraform validate -json'. This verifies that the HCL configuration syntax and input variable schemas are valid."),
        ("Stage 3: Planning", "The worker executes 'terraform plan -out=tfplan'. It calculates the exact infrastructure diff and confirms resource generation without errors."),
        ("Stage 4: Applying", "The worker executes 'terraform apply -auto-approve tfplan'. The local provider writes an immutable JSON manifest to /infrastructure/terraform/demo/manifests/vm-<id>.json containing the assigned hostname, IP (10.0.X.Y), and MAC address.")
    ]
    for s_name, s_desc in tf_stages:
        p = doc.add_paragraph(style='List Bullet')
        r1 = p.add_run(f"{s_name}: ")
        r1.font.bold = True
        r1.font.color.rgb = NAVY
        p.add_run(s_desc)

    add_h2("Security Controls for Child Process Execution")
    doc.add_paragraph(
        "• Fixed Binary Invocation: The binary path is strictly pinned (/usr/local/bin/terraform) with shell: false to eliminate shell injection vulnerabilities.\n"
        "• Strict Execution Timeouts: Every Terraform process is bound to a 60,000ms timeout. Any hung process is cleanly killed with SIGTERM/SIGKILL.\n"
        "• Isolated Output Buffering: Stdout and stderr streams are merged, timestamped, and sanitized before persistence into the database ProvisioningJob.logs column."
    )

    # 8. Fleet Inventory & Power State Lifecycle
    add_h1("8. Virtual Machine Inventory & Power State Lifecycle")
    doc.add_paragraph(
        "Upon successful Terraform apply, the worker registers a VirtualMachine record in the fleet inventory:"
    )
    doc.add_paragraph(
        "• Deterministic Network Addressing: VMs receive simulated enterprise private IP addresses (10.0.1.x) and unique MAC addresses.\n"
        "• Interactive Power Controls: Users can toggle power between RUNNING and STOPPED directly from the web portal.\n"
        "• Audit Logging on Power Actions: Every power state modification generates an immutable audit event (VM_POWER_START / VM_POWER_STOP) capturing the actor ID and timestamp.\n"
        "• Tenant Isolation: Developers can only view and control VMs that they personally own. Enterprise Admins maintain global oversight."
    )

    # 9. Failure Recovery & Safe Retries
    add_h1("9. Failure Recovery, Safe Retries, & Quota Rollbacks")
    doc.add_paragraph(
        "When infrastructure automation encounters errors (e.g. malformed inputs, timeouts, or provider issues), the platform "
        "executes a safe failure and recovery workflow:"
    )
    doc.add_paragraph(
        "1. Non-Zero Exit Code Capture: The worker captures the standard error stream and marks the ProvisioningJob as FAILED.\n"
        "2. State Machine Quarantine: Request status transitions to FAILED. The error diagnostic is clearly surfaced on the dashboard.\n"
        "3. Zero Ghost Inventory Guarantee: The database transaction aborts VM creation, ensuring failed runs never leave phantom active instances.\n"
        "4. Safe Retry Trigger: An administrator can click 'Retry' on the job. The status resets to PROVISIONING, a new job is dispatched to BullMQ, and the retry count increments safely without duplicate records.\n"
        "5. Cancellation & Quota Release: If the administrator cancels the failed request, the committed quota is immediately released back to the developer's pool."
    )

    # 10. Audit Logging & Compliance
    add_h1("10. Immutable Audit Logging & Compliance Ledger")
    doc.add_paragraph(
        "To satisfy enterprise compliance mandates (SOC 2, ISO 27001), all critical lifecycle operations are recorded in an "
        "append-only AuditLog database table. Records cannot be updated or deleted via the API."
    )
    
    audit_tbl = doc.add_table(rows=1, cols=3)
    audit_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    a_hdrs = audit_tbl.rows[0].cells
    a_hdrs[0].text = "Action Category"
    a_hdrs[1].text = "Logged Events"
    a_hdrs[2].text = "Persisted Structured Metadata"
    for c in a_hdrs:
        set_cell_shading(c, "1E293B")
        for p in c.paragraphs:
            for r in p.runs:
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)

    a_data = [
        ("Authentication", "USER_LOGIN, USER_LOGOUT", "IP address, user agent, timestamp, session ID"),
        ("Request Management", "REQUEST_SUBMITTED, REQUEST_CANCELLED", "VM specs (CPU/RAM/Disk), OS, justification, quota impact"),
        ("Governance & Approvals", "REQUEST_APPROVED, REQUEST_REJECTED", "Approver ID, justification comment, previous state, new state"),
        ("Automation Pipeline", "JOB_ENQUEUED, JOB_STARTED, JOB_COMPLETED, JOB_FAILED, JOB_RETRIED", "BullMQ job ID, execution duration, Terraform stage transitions, error codes"),
        ("Fleet Management", "VM_POWER_START, VM_POWER_STOP, VM_DECOMMISSIONED", "VM ID, IP address, previous power state, new power state"),
        ("Capacity Governance", "QUOTA_UPDATED", "Administrator ID, target user ID, old limits, new limits")
    ]
    for cat, evs, meta in a_data:
        rc = audit_tbl.add_row().cells
        rc[0].text = cat
        rc[0].paragraphs[0].runs[0].font.bold = True
        rc[1].text = evs
        rc[2].text = meta
        for cell in rc:
            set_cell_margins(cell, top=70, bottom=70, left=90, right=90)

    # 11. Quick User Guide & Execution Reference
    add_h1("11. Step-by-Step Operator & Verification Guide")
    doc.add_paragraph("Demo Credentials for Evaluation:")

    cred_tbl = doc.add_table(rows=1, cols=4)
    cred_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_hdrs = cred_tbl.rows[0].cells
    c_hdrs[0].text = "Persona"
    c_hdrs[1].text = "Email"
    c_hdrs[2].text = "Password"
    c_hdrs[3].text = "Role & Access Scope"
    for c in c_hdrs:
        set_cell_shading(c, "2563EB")
        for p in c.paragraphs:
            for r in p.runs:
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)

    c_data = [
        ("Enterprise Admin", "admin@infrapilot.local", "AdminPass123!", "Global Fleet Visibility, Approvals, Quotas, Audit Logs, Retries"),
        ("Senior IT Developer", "developer@infrapilot.local", "DevPass123!", "Self-Service Requests, Personal Inventory, Power State"),
        ("DevOps Engineer", "developer2@infrapilot.local", "DevPass123!", "Personal Inventory (Tenant Isolation test)")
    ]
    for p_name, em, pw, scope in c_data:
        rc = cred_tbl.add_row().cells
        rc[0].text = p_name
        rc[0].paragraphs[0].runs[0].font.bold = True
        rc[1].text = em
        rc[2].text = pw
        rc[3].text = scope
        for cell in rc:
            set_cell_margins(cell, top=70, bottom=70, left=90, right=90)

    doc.add_paragraph().paragraph_format.space_before = Pt(8)
    doc.add_paragraph("Quick Verification Flow in 4 Steps:")
    doc.add_paragraph("1. Sign in as Developer (http://localhost:5173/login) -> Click 'Request VM' -> Submit valid request.")
    doc.add_paragraph("2. Sign in as Admin -> Navigate to 'Approvals' -> Review and click 'Approve'.")
    doc.add_paragraph("3. Navigate to 'Provisioning Jobs' -> Watch live status transitions (VALIDATING -> PLANNING -> APPLYING -> COMPLETED).")
    doc.add_paragraph("4. Navigate to 'VM Inventory' -> View provisioned VM -> Toggle power state (Stop/Start) -> Check 'Audit Logs'.")

    doc.save(DOCX_PATH)
    print(f"[DOCX] Word document successfully generated at: {DOCX_PATH}")

def generate_pdf():
    print("[PDF] Generating Comprehensive Workflow Document (.pdf)...")
    doc = SimpleDocTemplate(
        PDF_PATH,
        pagesize=letter,
        leftMargin=46,
        rightMargin=46,
        topMargin=46,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'),
        alignment=1,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#475569'),
        alignment=1,
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=12,
        spaceAfter=4,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#2563EB'),
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#1E293B'),
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=2
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=6.5,
        leading=8.5,
        textColor=colors.HexColor('#0F172A')
    )

    th_style = ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=colors.white)
    td_style = ParagraphStyle('TD', fontName='Helvetica', fontSize=8, leading=10.5, textColor=colors.HexColor('#1E293B'))

    story = []

    # Title
    story.append(Paragraph("<b>ENTERPRISE IT APPLICATION ARCHITECTURE SPECIFICATION</b>", ParagraphStyle('Pre', fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor('#2563EB'), alignment=1, spaceAfter=2)))
    story.append(Paragraph("InfraPilot: End-to-End Workflow & Orchestration Guide", title_style))
    story.append(Paragraph("Detailed Technical Specification of Request Lifecycles, Quota Gating, BullMQ Orchestration, Terraform Sandboxing, and Fleet Governance", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563EB'), spaceAfter=8))

    # Section 1
    story.append(Paragraph("1. Enterprise Workflow Overview & Architecture Topology", h1_style))
    story.append(Paragraph(
        "<b>InfraPilot</b> is an enterprise self-service infrastructure management platform that orchestrates the complete "
        "lifecycle of virtual machine provisioning. The platform combines an Express.js REST API with an autonomous BullMQ "
        "background worker powered by Redis and HashiCorp Terraform. Operations are completely decoupled: HTTP web requests "
        "never block on infrastructure execution, eliminating 504 timeouts and ensuring maximum reliability.",
        body_style
    ))

    # Section 2: Sequence
    story.append(Paragraph("2. End-to-End Sequence & Swimlane Workflow", h1_style))
    seq_text = (
        "1. DEV: Submit VM Request (CPU, RAM, Disk, OS) -> 2. REST API: Validate schema & enforce quota\n"
        "3. API: Status -> PENDING_APPROVAL -> 4. ADMIN: Review queue -> Click 'Approve'\n"
        "5. API: Atomic Transaction (Status -> APPROVED, Insert Approval, Create Job, Log Audit)\n"
        "6. API: Enqueue Job to BullMQ ('provisioning' queue in Redis) -> Return 200 OK to UI\n"
        "7. WORKER: Atomically pops job -> Updates DB Stage: VALIDATING -> Runs terraform validate\n"
        "8. WORKER: Updates DB Stage: PLANNING -> Runs terraform plan\n"
        "9. WORKER: Updates DB Stage: APPLYING -> Runs terraform apply (Local Provider sandbox)\n"
        "10. WORKER: Atomic Transaction (Create VirtualMachine ACTIVE, Job -> COMPLETED, Audit Log)\n"
        "11. DEV/ADMIN: Dashboard shows Active VM with deterministic IP & interactive power controls"
    )
    story.append(Preformatted(seq_text, code_style))

    # Section 3: Quota Gating
    story.append(Paragraph("3. Request Initiation & Quota Gating Workflow", h1_style))
    story.append(Paragraph(
        "Requests pass through two strict validation tiers before admission into the workflow:<br/>"
        "• <b>Tier 1: Zod Schema Boundaries</b>: Enforces CPU (1-64), RAM (1024-262144 MB), Disk (10-4096 GB), OS whitelist, and justification text.<br/>"
        "• <b>Tier 2: Real-Time Server-Side Quota Gate</b>: Evaluates <code>(Committed_Resources + Requested_Resources <= Quota_Limit)</code>. "
        "If exceeded, the request is immediately rejected with HTTP 400 and excess calculations, preventing database pollution.",
        body_style
    ))

    # Section 4: State Machine
    story.append(Paragraph("4. The 8-State Finite State Machine (FSM) Lifecycle", h1_style))
    fsm_rows = [[
        Paragraph("<b>Source State</b>", th_style),
        Paragraph("<b>Allowed Targets</b>", th_style),
        Paragraph("<b>Actor</b>", th_style),
        Paragraph("<b>Trigger Event & Side Effect</b>", th_style)
    ]]
    fsm_data = [
        ("DRAFT", "PENDING_APPROVAL, CANCELLED", "Developer", "Developer submits or cancels draft. Quota evaluated."),
        ("PENDING_APPROVAL", "APPROVED, REJECTED, CANCELLED", "Admin / Dev", "Admin approval/rejection or developer cancellation. On APPROVE, job created."),
        ("APPROVED", "PROVISIONING, FAILED", "Worker", "Worker pops job from BullMQ. Status moves to PROVISIONING."),
        ("PROVISIONING", "ACTIVE, FAILED", "Terraform", "Terraform apply completes -> ACTIVE. Execution error -> FAILED."),
        ("ACTIVE", "DECOMMISSIONED", "Dev / Admin", "Instance decommissioned. Quotas freed in real-time."),
        ("FAILED", "PROVISIONING, CANCELLED", "Admin", "Manual retry re-queues job to BullMQ. Cancellation frees quota."),
        ("REJECTED", "Terminal State", "System", "Terminal audit record. Reserved quota commitment is released.")
    ]
    for s, t, a, tr in fsm_data:
        fsm_rows.append([
            Paragraph(f"<b>{s}</b>", td_style),
            Paragraph(t, td_style),
            Paragraph(a, td_style),
            Paragraph(tr, td_style)
        ])
    fsm_table = Table(fsm_rows, colWidths=[95, 135, 75, 215])
    fsm_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#2563EB')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(fsm_table)
    story.append(Spacer(1, 6))

    # Section 5: Governance
    story.append(Paragraph("5. Governance & Administrative Approval Workflow", h1_style))
    story.append(Paragraph(
        "• <b>Separation of Duties (RBAC)</b>: Developers are strictly barred from approving requests (HTTP 403 Forbidden).<br/>"
        "• <b>Anti-Self-Approval</b>: Administrators cannot approve requests they personally authored.<br/>"
        "• <b>Double-Approval Prevention</b>: Database row-level locks prevent race conditions; second approvals return HTTP 400.<br/>"
        "• <b>Mandatory Audit Trail</b>: Every decision requires an administrative comment recorded in the Approval history table.",
        body_style
    ))

    # Section 6 & 7: BullMQ & Terraform
    story.append(Paragraph("6. BullMQ Asynchronous Orchestration & Terraform Sandboxing", h1_style))
    story.append(Paragraph(
        "• <b>BullMQ Queueing</b>: Jobs are queued in Redis with 3 retry attempts and exponential backoff.<br/>"
        "• <b>Sandbox Directory Isolation</b>: The worker creates isolated workspaces (<code>/runs/&lt;jobId&gt;</code>) per execution.<br/>"
        "• <b>4-Stage Pipeline</b>: (1) Workspace Init -> (2) <code>terraform validate</code> -> (3) <code>terraform plan</code> -> (4) <code>terraform apply</code>.<br/>"
        "• <b>Security Controls</b>: Pinned binary invocation (<code>/usr/local/bin/terraform</code>), <code>shell: false</code> argument arrays (no injection), 60s hard timeout.<br/>"
        "• <b>Local Provider Output</b>: Writes JSON manifests (<code>/manifests/vm-*.json</code>) containing assigned hostname, IP (10.0.X.Y), and MAC address without incurring cloud bills.",
        body_style
    ))

    # Section 8 & 9: Inventory & Failure Recovery
    story.append(Paragraph("7. Fleet Inventory, Power States, & Safe Failure Recovery", h1_style))
    story.append(Paragraph(
        "• <b>Inventory Lifecycle</b>: Active VMs are bound to their owner and request. Power states (RUNNING / STOPPED) can be toggled interactively.<br/>"
        "• <b>Zero Ghost Inventory Guarantee</b>: If Terraform fails at any stage, VM creation is aborted, leaving no orphan records.<br/>"
        "• <b>Diagnostic Logs & Safe Retries</b>: Full stdout/stderr streams are saved. Administrators can trigger safe retries directly from the UI.<br/>"
        "• <b>Immutable Compliance Audit Trail</b>: All logins, requests, approvals, job retries, and power actions are stored in an append-only audit ledger.",
        body_style
    ))

    # Section 10: Operator Guide
    story.append(Paragraph("8. Operator Credentials & Verification Flow", h1_style))
    cred_rows = [[
        Paragraph("<b>Persona</b>", th_style),
        Paragraph("<b>Email</b>", th_style),
        Paragraph("<b>Password</b>", th_style),
        Paragraph("<b>Access Scope</b>", th_style)
    ]]
    c_list = [
        ("Enterprise Admin", "admin@infrapilot.local", "AdminPass123!", "Global Fleet, Approvals, Quotas, Audit Logs, Retries"),
        ("Senior Developer", "developer@infrapilot.local", "DevPass123!", "Self-Service Requests, Personal Inventory, Power State"),
        ("DevOps Engineer", "developer2@infrapilot.local", "DevPass123!", "Tenant Isolation test (isolated inventory)")
    ]
    for p, e, pw, sc in c_list:
        cred_rows.append([
            Paragraph(f"<b>{p}</b>", td_style),
            Paragraph(e, td_style),
            Paragraph(pw, td_style),
            Paragraph(sc, td_style)
        ])
    cred_table = Table(cred_rows, colWidths=[110, 140, 90, 180])
    cred_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(cred_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        "<b>Verification Steps in Browser:</b> Open <b>http://localhost:5173</b> -> Log in as Developer -> Submit VM request -> "
        "Log in as Admin -> Approve in Approvals -> Watch Provisioning Jobs live progress -> View VM Inventory and toggle power.",
        body_style
    ))

    def add_header_footer(canvas, doc):
        canvas.saveState()
        canvas.setFont('Helvetica', 7.5)
        canvas.setFillColor(colors.HexColor('#64748B'))
        canvas.drawString(46, 752, "InfraPilot — Enterprise Self-Service Infrastructure Management Platform")
        canvas.drawRightString(612 - 46, 752, "End-to-End Workflow Specification")
        canvas.setStrokeColor(colors.HexColor('#CBD5E1'))
        canvas.setLineWidth(0.5)
        canvas.line(46, 746, 612 - 46, 746)
        canvas.line(46, 40, 612 - 46, 40)
        canvas.drawString(46, 28, "Confidential — Architecture & Workflow Evaluation")
        canvas.drawRightString(612 - 46, 28, f"Page {doc.page}")
        canvas.restoreState()

    doc.build(story, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
    print(f"[PDF] PDF document successfully generated at: {PDF_PATH}")

if __name__ == '__main__':
    generate_docx()
    generate_pdf()
