import { CabRoute, DispatchDataset, Employee, OfficeLocation, SecurityGuard } from '../types/dispatch';

export const TELANGANA_OFFICE: OfficeLocation = {
  id: 'OFFICE_CORP_HYD',
  name: 'Corporate Facility Hyderabad',
  code: 'HQ-HYD',
  lat: 17.4648,
  lng: 78.3610,
  address: '19th Floor, Block A, Aparna Technopolis, Survey No. 14P, Kondapur, Hyderabad, Telangana 500084',
};

const DRIVER_NAMES = [
  'Ramesh Goud', 'Suresh Kumar', 'Venkatesh Rao', 'Narasimha Reddy', 'Satyanarayana',
  'Mohammad Rafiq', 'Dinesh Varma', 'Syed Khaja', 'Balaraju M', 'Anjaneyulu K',
  'Mahesh Babu', 'Prabhakar Naidu', 'Mallesh Yadav', 'Shiva Krishna', 'Rajeshwar Rao',
  'Naveen Kumar', 'Srinivasulu', 'Chandra Shekar', 'Bikshapathi', 'Ramulu G'
];

const VEHICLE_PREFIXES = ['TS 09 UB', 'TS 07 UA', 'TS 08 UC', 'TS 10 UD', 'TS 09 UE'];
const CAB_MODELS = ['Maruti Ertiga White', 'Maruti Dzire Silver', 'Toyota Innova Crysta', 'Tata Tigor EV', 'Hyundai Aura'];

interface ClusterSeed {
  area: string;
  baseLat: number;
  baseLng: number;
  spreadKm: number;
  hotspots: {
    society: string;
    lat: number;
    lng: number;
    count: number;
  }[];
  randomCount: number;
}

const FIRST_NAMES_MALE = [
  'Aarav', 'Vihaan', 'Aditya', 'Sai', 'Rahul', 'Arjun', 'Rohan', 'Vikram', 'Pranav', 'Karthik',
  'Siddharth', 'Nikhil', 'Gautam', 'Varun', 'Tarun', 'Anand', 'Harsh', 'Manish', 'Suresh', 'Ramesh',
  'Venkatesh', 'Deepak', 'Sanjay', 'Kiran', 'Rajesh', 'Srikanth', 'Dinesh', 'Abhishek', 'Surya', 'Manoj'
];

const FIRST_NAMES_FEMALE = [
  'Ananya', 'Priya', 'Sneha', 'Deepika', 'Kavya', 'Pooja', 'Isha', 'Meera', 'Riya', 'Shruti',
  'Swati', 'Aditi', 'Divya', 'Neha', 'Shreya', 'Anushka', 'Tanvi', 'Lavanya', 'Harini', 'Bhavana',
  'Manasa', 'Sowmya', 'Aishwarya', 'Keerthi', 'Radhika', 'Sindhu', 'Vaishnavi', 'Pallavi', 'Madhuri', 'Tejaswi'
];

const LAST_NAMES = [
  'Reddy', 'Rao', 'Sharma', 'Verma', 'Gupta', 'Patel', 'Nair', 'Menon', 'Chowdhary', 'Kumar',
  'Goud', 'Kulkarni', 'Joshi', 'Mishra', 'Iyer', 'Deshmukh', 'Bhat', 'Prasad', 'Singhal', 'Babu',
  'Chandra', 'Varma', 'Naidu', 'Vemula', 'Kondapalli', 'Banda', 'Das', 'Sen', 'Pillai', 'Rathore'
];

const DEPARTMENTS = [
  'Identity Resolution',
  'Data Science & AI',
  'Platform Engineering',
  'Cloud Infrastructure',
  'Security & Compliance',
  'Product Design',
  'Customer Success',
  'Data Privacy Engineering',
];

const CLUSTER_SEEDS: ClusterSeed[] = [
  {
    area: 'Kondapur & Kothaguda',
    baseLat: 17.4645,
    baseLng: 78.3582,
    spreadKm: 1.2,
    hotspots: [
      { society: 'Aparna Luxor Park, Kondapur', lat: 17.4682, lng: 78.3615, count: 5 },
      { society: 'My Home Mangala, Kondapur', lat: 17.4625, lng: 78.3542, count: 4 },
    ],
    randomCount: 9,
  },
  {
    area: 'Gachibowli & Financial District',
    baseLat: 17.4298,
    baseLng: 78.3412,
    spreadKm: 2.0,
    hotspots: [
      { society: 'My Home Bhooja, Silpa Gram', lat: 17.4398, lng: 78.3741, count: 6 },
      { society: 'Prestige High Fields, Financial District', lat: 17.4168, lng: 78.3445, count: 5 },
    ],
    randomCount: 7,
  },
  {
    area: 'HITEC City & Madhapur',
    baseLat: 17.4485,
    baseLng: 78.3908,
    spreadKm: 1.2,
    hotspots: [
      { society: 'Fresh Living Apartments, Madhapur', lat: 17.4452, lng: 78.3889, count: 4 },
      { society: 'Ayyappa Society, Madhapur', lat: 17.4531, lng: 78.3934, count: 4 },
    ],
    randomCount: 6,
  },
  {
    area: 'Kukatpally & KPHB Colony',
    baseLat: 17.4938,
    baseLng: 78.3995,
    spreadKm: 1.8,
    hotspots: [
      { society: 'Malaysian Township, KPHB', lat: 17.4899, lng: 78.3912, count: 5 },
      { society: 'Lodha Bellezza, Eden Square, KPHB', lat: 17.4876, lng: 78.3884, count: 4 },
    ],
    randomCount: 7,
  },
  {
    area: 'Miyapur & Hafeezpet',
    baseLat: 17.4969,
    baseLng: 78.3568,
    spreadKm: 2.2,
    hotspots: [
      { society: 'SMR Vinay City, Miyapur', lat: 17.4945, lng: 78.3589, count: 4 },
    ],
    randomCount: 8,
  },
  {
    area: 'Jubilee Hills & Banjara Hills',
    baseLat: 17.4300,
    baseLng: 78.4150,
    spreadKm: 2.5,
    hotspots: [
      { society: 'Road No 12 Enclave, Banjara Hills', lat: 17.4121, lng: 78.4412, count: 3 },
    ],
    randomCount: 5,
  },
  {
    area: 'Secunderabad & Begumpet',
    baseLat: 17.4489,
    baseLng: 78.4890,
    spreadKm: 2.8,
    hotspots: [
      { society: 'Prakash Nagar Officers Colony, Begumpet', lat: 17.4412, lng: 78.4721, count: 3 },
    ],
    randomCount: 5,
  },
  {
    area: 'Uppal & LB Nagar Corridor',
    baseLat: 17.3850,
    baseLng: 78.5550,
    spreadKm: 3.0,
    hotspots: [
      { society: 'Green Hills Colony, Kothapet', lat: 17.3712, lng: 78.5398, count: 3 },
    ],
    randomCount: 3,
  },
];

function addKmOffset(lat: number, lng: number, dxKm: number, dyKm: number) {
  const dLat = dyKm / 111;
  const dLng = dxKm / (111 * Math.cos((lat * Math.PI) / 180));
  return {
    lat: Number((lat + dLat).toFixed(5)),
    lng: Number((lng + dLng).toFixed(5)),
  };
}

export function generateDataset(): DispatchDataset {
  const employees: Employee[] = [];
  let idCounter = 1001;

  for (const cluster of CLUSTER_SEEDS) {
    for (const spot of cluster.hotspots) {
      for (let i = 0; i < spot.count; i++) {
        const isFemale = (idCounter * 7 + i * 3) % 10 < 4;
        const firstName = isFemale
          ? FIRST_NAMES_FEMALE[(idCounter + i) % FIRST_NAMES_FEMALE.length]
          : FIRST_NAMES_MALE[(idCounter + i) % FIRST_NAMES_MALE.length];
        const lastName = LAST_NAMES[(idCounter * 3 + i) % LAST_NAMES.length];
        const dept = DEPARTMENTS[(idCounter + i) % DEPARTMENTS.length];

        employees.push({
          id: `EMP-${idCounter}`,
          name: `${firstName} ${lastName}`,
          gender: isFemale ? 'female' : 'male',
          lat: spot.lat,
          lng: spot.lng,
          clusterArea: cluster.area,
          department: dept,
          shift: 'general',
          address: `${spot.society}, Flat ${101 + (i % 20) * 10 + (i % 4)}, Hyderabad`,
          phone: `+91 98480 ${String(12000 + (idCounter * 37) % 87000).padStart(5, '0')}`,
          boardingStatus: 'awaiting_cab',
          otpCode: `${1000 + (idCounter * 17) % 9000}`,
        });
        idCounter++;
      }
    }

    for (let i = 0; i < cluster.randomCount; i++) {
      const angle = ((i * 137.5) % 360) * (Math.PI / 180);
      const distKm = (((i * 47) % 100) / 100) * cluster.spreadKm;
      const dx = Math.cos(angle) * distKm;
      const dy = Math.sin(angle) * distKm;

      const coords = addKmOffset(cluster.baseLat, cluster.baseLng, dx, dy);
      const isFemale = (idCounter * 11 + i) % 10 < 4;
      const firstName = isFemale
        ? FIRST_NAMES_FEMALE[(idCounter + i) % FIRST_NAMES_FEMALE.length]
        : FIRST_NAMES_MALE[(idCounter + i) % FIRST_NAMES_MALE.length];
      const lastName = LAST_NAMES[(idCounter * 5 + i) % LAST_NAMES.length];
      const dept = DEPARTMENTS[(idCounter + i) % DEPARTMENTS.length];

      employees.push({
        id: `EMP-${idCounter}`,
        name: `${firstName} ${lastName}`,
        gender: isFemale ? 'female' : 'male',
        lat: coords.lat,
        lng: coords.lng,
        clusterArea: cluster.area,
        department: dept,
        shift: 'general',
        address: `Road No ${1 + (i % 15)}, ${cluster.area}, Hyderabad`,
        phone: `+91 98480 ${String(14000 + (idCounter * 43) % 85000).padStart(5, '0')}`,
        boardingStatus: 'awaiting_cab',
        otpCode: `${1000 + (idCounter * 23) % 9000}`,
      });
      idCounter++;
    }
  }

  const raw100 = employees.slice(0, 100);

  // Explicitly calibrate key demo records:
  // Route R-02: All-female with assigned security guard (Sunitha Rao)
  // Indices 3, 4, 5 (for route 2): make all female
  if (raw100[3]) {
    raw100[3].gender = 'female';
    raw100[3].name = 'Ananya Reddy';
  }
  if (raw100[4]) {
    raw100[4].gender = 'female';
    raw100[4].name = 'Priya Sharma';
  }
  if (raw100[5]) {
    raw100[5].gender = 'female';
    raw100[5].name = 'Sneha Rao';
  }

  // Route R-04: Female first pickup / last drop with NO guard (demonstrates safety flag violation)
  // Indices 9, 10, 11 (for route 4): make index 9 female
  if (raw100[9]) {
    raw100[9].gender = 'female';
    raw100[9].name = 'Kavya Gupta';
  }
  if (raw100[10]) {
    raw100[10].gender = 'male';
    raw100[10].name = 'Rahul Verma';
  }
  if (raw100[11]) {
    raw100[11].gender = 'female';
    raw100[11].name = 'Divya Nair';
  }

  const cabs: CabRoute[] = [];

  // Group into 32 Cabs of max 3 passengers each (and leave last 4 unassigned)
  let routeIdx = 1;
  let currentGroup: Employee[] = [];

  for (let i = 0; i < raw100.length; i++) {
    if (i >= 96) {
      raw100[i].routeNumber = null;
      raw100[i].pickupSequence = null;
      raw100[i].boardingStatus = 'awaiting_cab';
      continue;
    }

    currentGroup.push(raw100[i]);

    if (currentGroup.length === 3 || i === 95) {
      const routeNum = `R-${routeIdx.toString().padStart(2, '0')}`;
      const vehNum = `${VEHICLE_PREFIXES[(routeIdx - 1) % VEHICLE_PREFIXES.length]} ${1000 + (routeIdx * 123) % 8999}`;
      const driverName = DRIVER_NAMES[(routeIdx - 1) % DRIVER_NAMES.length];
      const model = CAB_MODELS[(routeIdx - 1) % CAB_MODELS.length];

      // Ordering:
      // For R-04, keep female at stop 1 to demonstrate female first pickup violation
      let ordered: Employee[];
      if (routeIdx === 4) {
        ordered = [...currentGroup]; // Keep Kavya at stop 1
      } else if (routeIdx === 2) {
        ordered = [...currentGroup]; // All female
      } else {
        const males = currentGroup.filter((e) => e.gender === 'male');
        const females = currentGroup.filter((e) => e.gender === 'female');
        ordered = [...males, ...females];
      }

      // Security Guard assignment:
      // Route 2 is the demo all-female cab with an authorized security guard escort
      let guard: SecurityGuard | null = null;
      if (routeIdx === 2) {
        guard = {
          name: 'Sunitha Rao (Armed Escort)',
          phone: '+91 99887 76655',
          agency: 'SIS Security Hyderabad',
          badgeNumber: 'SEC-8421',
          verified: true,
        };
      } else if (routeIdx === 8) {
        // Also guard Route 8 for extra realism
        guard = {
          name: 'V. Prakash (Night Escort)',
          phone: '+91 98492 44332',
          agency: 'G4S Secure Solutions',
          badgeNumber: 'G4S-1192',
          verified: true,
        };
      }

      // Realistic live states across fleet
      let cabStatus: CabRoute['currentStatus'] = 'en_route_pickup';
      let covered = 2.4;
      let remaining = 5.2;

      if (routeIdx <= 5) {
        cabStatus = 'in_transit';
        ordered[0].boardingStatus = 'boarded';
        if (ordered.length > 1) ordered[1].boardingStatus = 'boarded';
        covered = 4.8;
        remaining = 3.2;
      } else if (routeIdx <= 15) {
        cabStatus = 'en_route_pickup';
        ordered[0].boardingStatus = 'boarded';
        ordered.slice(1).forEach((e) => (e.boardingStatus = 'awaiting_cab'));
        covered = 1.9;
        remaining = 6.4;
      } else {
        cabStatus = 'en_route_pickup';
        ordered.forEach((e) => (e.boardingStatus = 'awaiting_cab'));
        covered = 0.5;
        remaining = 8.1;
      }

      ordered.forEach((emp, seq) => {
        emp.routeNumber = routeNum;
        emp.pickupSequence = seq + 1;
      });

      // Compute simulated live cab position
      const nextTargetEmp = ordered.find((e) => e.boardingStatus === 'awaiting_cab') || ordered[0];
      const cabLat = Number((nextTargetEmp.lat + (Math.sin(routeIdx) * 0.005)).toFixed(5));
      const cabLng = Number((nextTargetEmp.lng + (Math.cos(routeIdx) * 0.005)).toFixed(5));

      cabs.push({
        routeNumber: routeNum,
        vehicleNumber: vehNum,
        cabModel: model,
        driver: {
          name: driverName,
          phone: `+91 98490 ${String(10000 + routeIdx * 137).slice(-5)}`,
          rating: 4.8 + ((routeIdx % 3) * 0.05),
        },
        guard,
        currentStatus: cabStatus,
        currentLocation: {
          lat: cabLat,
          lng: cabLng,
          headingDeg: (routeIdx * 57) % 360,
          lastUpdated: 'Just now',
        },
        nextStop: {
          employeeId: nextTargetEmp.id,
          employeeName: nextTargetEmp.name,
          type: 'pickup',
          etaMinutes: 4 + (routeIdx % 8),
          targetLat: nextTargetEmp.lat,
          targetLng: nextTargetEmp.lng,
        },
        metrics: {
          coveredKm: covered,
          remainingKm: remaining,
          totalEstimatedKm: Number((covered + remaining).toFixed(1)),
          etaMinutes: 12 + (routeIdx % 15),
        },
        passengers: ordered,
      });

      routeIdx++;
      currentGroup = [];
    }
  }

  return {
    region: {
      state: 'Telangana',
      city: 'Hyderabad - Tech Hub',
      description: 'Corporate transport routing to Corporate Facility Hyderabad (Aparna Technopolis, Kondapur).',
    },
    office: TELANGANA_OFFICE,
    employees: raw100,
    cabs,
  };
}

export function getTelanganaDataset(): DispatchDataset {
  return generateDataset();
}
