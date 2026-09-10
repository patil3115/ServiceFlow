const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const { User, Category, Ticket, Comment, AuditLog } = require('../models');

// Load environment variables
dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();

    const shouldReset = process.argv.includes('--reset');
    if (shouldReset) {
      console.log('[Seed] Explicit --reset flag detected: clearing existing collections...');
      await Promise.all([
        User.deleteMany({}),
        Category.deleteMany({}),
        Ticket.deleteMany({}),
        Comment.deleteMany({}),
        AuditLog.deleteMany({})
      ]);
    } else {
      console.log('[Seed] Safe non-destructive mode: preserving all existing user and ticket data.');
    }

    console.log('[Seed] Checking/Seeding categories...');
    const categoriesData = [
      {
        name: 'Hardware',
        description: 'Physical workstations, laptops, monitors, peripherals, and workstation hardware.'
      },
      {
        name: 'Software',
        description: 'Enterprise software licensing, IDEs, office suites, and OS installations.'
      },
      {
        name: 'Network',
        description: 'Office Wi-Fi, remote VPN connectivity, LAN switches, DNS, and latency.'
      },
      {
        name: 'Account / Access',
        description: 'Active Directory, Single Sign-On (SSO), role access, and password resets.'
      },
      {
        name: 'Email',
        description: 'Corporate email routing, distribution list management, and spam filters.'
      },
      {
        name: 'Security',
        description: 'Suspicious email reporting, security policy exemptions, malware, and credential leaks.'
      },
      {
        name: 'Other',
        description: 'Conference room audiovisual equipment, printing, and general inquiries.'
      }
    ];

    let categoryCount = 0;
    for (const cat of categoriesData) {
      const exists = await Category.findOne({ name: cat.name });
      if (!exists) {
        await Category.create(cat);
        categoryCount++;
      }
    }
    console.log(`[Seed] Categories checked. Added ${categoryCount} new categories.`);

    console.log('[Seed] Checking/Seeding demo users...');
    let adminUser = await User.findOne({ email: 'admin@serviceflow.local' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Alex Vance (Admin)',
        email: 'admin@serviceflow.local',
        password: 'Admin@12345',
        department: 'IT Infrastructure',
        role: 'ADMIN',
        isActive: true
      });
      console.log('  + Created admin user: admin@serviceflow.local');
    } else {
      console.log('  ✓ Existing admin user preserved: admin@serviceflow.local');
    }

    let agentUser = await User.findOne({ email: 'agent@serviceflow.local' });
    if (!agentUser) {
      agentUser = await User.create({
        name: 'Sarah Connor (Support Agent)',
        email: 'agent@serviceflow.local',
        password: 'Agent@12345',
        department: 'IT Support Desk',
        role: 'SUPPORT_AGENT',
        isActive: true
      });
      console.log('  + Created agent user: agent@serviceflow.local');
    } else {
      console.log('  ✓ Existing agent user preserved: agent@serviceflow.local');
    }

    let employeeUser = await User.findOne({ email: 'employee@serviceflow.local' });
    if (!employeeUser) {
      employeeUser = await User.create({
        name: 'John Doe (Employee)',
        email: 'employee@serviceflow.local',
        password: 'Employee@12345',
        department: 'Software Engineering',
        role: 'EMPLOYEE',
        isActive: true
      });
      console.log('  + Created employee user: employee@serviceflow.local');
    } else {
      console.log('  ✓ Existing employee user preserved: employee@serviceflow.local');
    }

    let secondEmployee = await User.findOne({ email: 'elena@serviceflow.local' });
    if (!secondEmployee) {
      secondEmployee = await User.create({
        name: 'Elena Rostova (Employee)',
        email: 'elena@serviceflow.local',
        password: 'Employee@12345',
        department: 'Product Design',
        role: 'EMPLOYEE',
        isActive: true
      });
      console.log('  + Created second employee user: elena@serviceflow.local');
    } else {
      console.log('  ✓ Existing employee user preserved: elena@serviceflow.local');
    }

    // Check if initial sample tickets already exist
    const hasSampleTickets = await Ticket.exists({ ticketNumber: 'INC-1001' });
    if (hasSampleTickets && !shouldReset) {
      console.log('[Seed] Sample demo tickets (INC-1001) already present. Skipping ticket creation to preserve existing database state.');
      console.log('\n========================================');
      console.log('[Seed] SUCCESS: Database Ready & Preserved!');
      console.log('========================================');
      console.log('Development / Demo Credentials:');
      console.log('  ADMIN:    admin@serviceflow.local    / Admin@12345');
      console.log('  AGENT:    agent@serviceflow.local    / Agent@12345');
      console.log('  EMPLOYEE: employee@serviceflow.local / Employee@12345');
      console.log('  EMPLOYEE: elena@serviceflow.local    / Employee@12345');
      console.log('========================================\n');
      process.exit(0);
    }

    console.log('[Seed] Seeding tickets with realistic SLA calculation...');
    const now = new Date();

    // SLA Durations in hours
    const SLA_HOURS = {
      CRITICAL: 2,
      HIGH: 4,
      MEDIUM: 8,
      LOW: 24
    };

    const calcDeadline = (date, priority) => {
      const hours = SLA_HOURS[priority] || 8;
      return new Date(date.getTime() + hours * 60 * 60 * 1000);
    };

    // Ticket 1: In Progress
    const t1Created = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
    const ticket1 = await Ticket.create({
      ticketNumber: 'INC-1001',
      title: 'Cannot establish Cisco AnyConnect VPN tunnel from home network',
      description: 'Since 8:30 AM this morning, Cisco AnyConnect fails with handshake error 403. Home ISP is functioning normally on other devices.',
      category: 'Network',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      createdBy: employeeUser._id,
      assignedTo: agentUser._id,
      department: employeeUser.department,
      slaDeadline: calcDeadline(t1Created, 'HIGH'),
      isSlaBreached: false,
      createdAt: t1Created,
      updatedAt: new Date(t1Created.getTime() + 45 * 60 * 1000)
    });

    // Ticket 2: Critical Open
    const t2Created = new Date(now.getTime() - 40 * 60 * 1000); // 40 minutes ago
    const ticket2 = await Ticket.create({
      ticketNumber: 'INC-1002',
      title: 'Production Staging Database experiencing severe connection pool exhaustion',
      description: 'Backend staging environment unable to acquire new MongoDB connection pool slots. Multiple developers currently blocked.',
      category: 'Software',
      priority: 'CRITICAL',
      status: 'OPEN',
      createdBy: employeeUser._id,
      assignedTo: null,
      department: employeeUser.department,
      slaDeadline: calcDeadline(t2Created, 'CRITICAL'),
      isSlaBreached: false,
      createdAt: t2Created,
      updatedAt: t2Created
    });

    // Ticket 3: Assigned Low Priority
    const t3Created = new Date(now.getTime() - 5 * 60 * 60 * 1000); // 5 hours ago
    const ticket3 = await Ticket.create({
      ticketNumber: 'INC-1003',
      title: 'Secondary 27-inch 4K monitor procurement request for workstation',
      description: 'Approved by department manager for design and UI review requirements. Standard Dell UltraSharp preferred.',
      category: 'Hardware',
      priority: 'LOW',
      status: 'ASSIGNED',
      createdBy: secondEmployee._id,
      assignedTo: agentUser._id,
      department: secondEmployee.department,
      slaDeadline: calcDeadline(t3Created, 'LOW'),
      isSlaBreached: false,
      createdAt: t3Created,
      updatedAt: new Date(t3Created.getTime() + 60 * 60 * 1000)
    });

    // Ticket 4: Resolved Ticket
    const t4Created = new Date(now.getTime() - 26 * 60 * 60 * 1000); // 26 hours ago
    const t4Resolved = new Date(t4Created.getTime() + 3 * 60 * 60 * 1000);
    const ticket4 = await Ticket.create({
      ticketNumber: 'INC-1004',
      title: 'Okta MFA device reset required after mobile device upgrade',
      description: 'Replaced smartphone yesterday and old Authenticator app is no longer accessible. Need MFA profile push reset.',
      category: 'Account / Access',
      priority: 'MEDIUM',
      status: 'RESOLVED',
      createdBy: employeeUser._id,
      assignedTo: agentUser._id,
      department: employeeUser.department,
      resolution: {
        notes: 'Verified employee identity via video verification with manager confirmation and reset Okta MFA profile successfully.',
        resolvedAt: t4Resolved,
        resolvedBy: agentUser._id
      },
      slaDeadline: calcDeadline(t4Created, 'MEDIUM'),
      isSlaBreached: false,
      createdAt: t4Created,
      updatedAt: t4Resolved
    });

    // Ticket 5: Closed Ticket
    const t5Created = new Date(now.getTime() - 72 * 60 * 60 * 1000); // 3 days ago
    const t5Resolved = new Date(t5Created.getTime() + 2 * 60 * 60 * 1000);
    const t5Closed = new Date(t5Resolved.getTime() + 24 * 60 * 60 * 1000);
    const ticket5 = await Ticket.create({
      ticketNumber: 'INC-1005',
      title: 'Targeted spear phishing campaign spoofing executive payroll distribution',
      description: 'Received email from spoofed CFO domain requesting urgent direct deposit updates. Headers captured and attached.',
      category: 'Security',
      priority: 'HIGH',
      status: 'CLOSED',
      createdBy: secondEmployee._id,
      assignedTo: agentUser._id,
      department: secondEmployee.department,
      resolution: {
        notes: 'Blocked originating sender domain in Proofpoint mail gateway, quarantined 18 identical delivery inbox copies, and notified security team.',
        resolvedAt: t5Resolved,
        resolvedBy: agentUser._id
      },
      closedAt: t5Closed,
      closedBy: secondEmployee._id,
      slaDeadline: calcDeadline(t5Created, 'HIGH'),
      isSlaBreached: false,
      createdAt: t5Created,
      updatedAt: t5Closed
    });

    console.log('[Seed] Seeded 5 tickets spanning statuses and priorities.');

    console.log('[Seed] Seeding ticket comments...');
    await Comment.create([
      {
        ticketId: ticket1._id,
        userId: agentUser._id,
        message: 'Hello John, I am investigating this now. Checking if your VPN certificate expired in the Active Directory RADIUS server.',
        createdAt: new Date(t1Created.getTime() + 20 * 60 * 1000)
      },
      {
        ticketId: ticket1._id,
        userId: employeeUser._id,
        message: 'Thank you Sarah. I just tried clearing client cache as well, error persists.',
        createdAt: new Date(t1Created.getTime() + 35 * 60 * 1000)
      },
      {
        ticketId: ticket4._id,
        userId: agentUser._id,
        message: 'MFA profile has been reset. Please navigate to login portal and follow the QR scan prompt.',
        createdAt: t4Resolved
      }
    ]);
    console.log('[Seed] Seeded ticket comments.');

    console.log('[Seed] Seeding audit logs...');
    await AuditLog.create([
      // Ticket 1 audits
      {
        ticketId: ticket1._id,
        userId: employeeUser._id,
        action: 'TICKET_CREATED',
        newValue: 'OPEN',
        metadata: { title: ticket1.title, priority: 'HIGH' },
        createdAt: t1Created
      },
      {
        ticketId: ticket1._id,
        userId: adminUser._id,
        action: 'TICKET_ASSIGNED',
        oldValue: null,
        newValue: agentUser.name,
        metadata: { assignedToId: agentUser._id },
        createdAt: new Date(t1Created.getTime() + 15 * 60 * 1000)
      },
      {
        ticketId: ticket1._id,
        userId: agentUser._id,
        action: 'STATUS_CHANGED',
        oldValue: 'ASSIGNED',
        newValue: 'IN_PROGRESS',
        metadata: { note: 'Investigation started' },
        createdAt: new Date(t1Created.getTime() + 45 * 60 * 1000)
      },

      // Ticket 4 audits
      {
        ticketId: ticket4._id,
        userId: employeeUser._id,
        action: 'TICKET_CREATED',
        newValue: 'OPEN',
        metadata: { title: ticket4.title, priority: 'MEDIUM' },
        createdAt: t4Created
      },
      {
        ticketId: ticket4._id,
        userId: agentUser._id,
        action: 'TICKET_RESOLVED',
        oldValue: 'IN_PROGRESS',
        newValue: 'RESOLVED',
        metadata: { notes: ticket4.resolution.notes },
        createdAt: t4Resolved
      },

      // Ticket 5 audits
      {
        ticketId: ticket5._id,
        userId: secondEmployee._id,
        action: 'TICKET_CREATED',
        newValue: 'OPEN',
        metadata: { title: ticket5.title, priority: 'HIGH' },
        createdAt: t5Created
      },
      {
        ticketId: ticket5._id,
        userId: agentUser._id,
        action: 'TICKET_RESOLVED',
        oldValue: 'IN_PROGRESS',
        newValue: 'RESOLVED',
        metadata: { notes: ticket5.resolution.notes },
        createdAt: t5Resolved
      },
      {
        ticketId: ticket5._id,
        userId: secondEmployee._id,
        action: 'TICKET_CLOSED',
        oldValue: 'RESOLVED',
        newValue: 'CLOSED',
        metadata: { closedBy: 'Employee confirmation' },
        createdAt: t5Closed
      }
    ]);
    console.log('[Seed] Seeded audit logs.');

    console.log('\n========================================');
    console.log('[Seed] SUCCESS: Database Seeded Completely!');
    console.log('========================================');
    console.log('Default Credentials:');
    console.log('  ADMIN:    admin@serviceflow.local    / Admin@12345');
    console.log('  AGENT:    agent@serviceflow.local    / Agent@12345');
    console.log('  EMPLOYEE: employee@serviceflow.local / Employee@12345');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
