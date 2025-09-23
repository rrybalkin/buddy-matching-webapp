import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create HR user
  const hrPassword = await bcrypt.hash('password123', 12);
  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@company.com' },
    update: {
      firstName: 'Human',
      lastName: 'Resources',
      password: hrPassword,
      profile: {
        upsert: {
          create: {
            phone: '+1-555-0101',
            department: 'Human Resources',
            position: 'HR Manager',
            location: 'New York',
            bio: 'Passionate about creating great employee experiences and fostering connections.',
            interests: ['Team Building', 'Employee Development', 'Workplace Culture'],
            languages: ['English', 'Spanish']
          },
          update: {
            phone: '+1-555-0101',
            department: 'Human Resources',
            position: 'HR Manager',
            location: 'New York',
            bio: 'Passionate about creating great employee experiences and fostering connections.',
            interests: ['Team Building', 'Employee Development', 'Workplace Culture'],
            languages: ['English', 'Spanish']
          }
        }
      }
    },
    create: {
      email: 'hr@company.com',
      password: hrPassword,
      firstName: 'Human',
      lastName: 'Resources',
      role: 'HR',
      profile: {
        create: {
          phone: '+1-555-0101',
          department: 'Human Resources',
          position: 'HR Manager',
          location: 'New York',
          bio: 'Passionate about creating great employee experiences and fostering connections.',
          interests: ['Team Building', 'Employee Development', 'Workplace Culture'],
          languages: ['English', 'Spanish']
        }
      }
    }
  });

  // Create buddy users
  const buddyUsers = [
    {
      email: 'john.doe@company.com',
      firstName: 'John',
      lastName: 'Doe',
      department: 'Engineering',
      position: 'Senior Software Engineer',
      location: 'San Francisco',
      techStack: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
      interests: ['Hiking', 'Photography', 'Coffee'],
      experience: '5+ years',
      mentoringStyle: 'Hands-on with regular check-ins'
    },
    {
      email: 'jane.smith@company.com',
      firstName: 'Jane',
      lastName: 'Smith',
      department: 'Product',
      position: 'Product Manager',
      location: 'New York',
      techStack: ['Product Strategy', 'User Research', 'Agile'],
      interests: ['Yoga', 'Reading', 'Travel'],
      experience: '7+ years',
      mentoringStyle: 'Structured approach with clear goals'
    },
    {
      email: 'mike.wilson@company.com',
      firstName: 'Mike',
      lastName: 'Wilson',
      department: 'Design',
      position: 'UX Designer',
      location: 'Austin',
      techStack: ['Figma', 'Sketch', 'User Research', 'Prototyping'],
      interests: ['Art', 'Music', 'Gaming'],
      experience: '4+ years',
      mentoringStyle: 'Creative and collaborative'
    },
    // European buddies
    {
      email: 'ana.petrovic@company.com',
      firstName: 'Ana',
      lastName: 'Petrović',
      department: 'Engineering',
      position: 'Full Stack Developer',
      location: 'Belgrade, Serbia',
      techStack: ['Java', 'Spring Boot', 'React', 'PostgreSQL'],
      interests: ['Bicycle', 'Hiking', 'Photography', 'Coffee'],
      experience: '6+ years',
      mentoringStyle: 'Patient and methodical approach'
    },
    {
      email: 'dimitar.ivanov@company.com',
      firstName: 'Dimitar',
      lastName: 'Ivanov',
      department: 'DevOps',
      position: 'DevOps Engineer',
      location: 'Sofia, Bulgaria',
      techStack: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'Python'],
      interests: ['Bicycle', 'Movies', 'Gaming', 'Cooking'],
      experience: '8+ years',
      mentoringStyle: 'Technical deep-dives with practical examples'
    },
    {
      email: 'carlos.rodriguez@company.com',
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      department: 'Data Science',
      position: 'Data Scientist',
      location: 'Madrid, Spain',
      techStack: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Pandas'],
      interests: ['Hiking', 'Movies', 'PlayStation', 'Wine Tasting'],
      experience: '5+ years',
      mentoringStyle: 'Data-driven and analytical approach'
    },
    {
      email: 'maria.garcia@company.com',
      firstName: 'María',
      lastName: 'García',
      department: 'Engineering',
      position: 'Backend Developer',
      location: 'Barcelona, Spain',
      techStack: ['Java', 'Spring', 'Microservices', 'Redis', 'MongoDB'],
      interests: ['Bicycle', 'Travel', 'Photography', 'Dancing'],
      experience: '7+ years',
      mentoringStyle: 'Encouraging and supportive with clear guidance'
    },
    // Other international buddies
    {
      email: 'ahmet.yilmaz@company.com',
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      department: 'Engineering',
      position: 'Mobile Developer',
      location: 'Istanbul, Turkey',
      techStack: ['React Native', 'Flutter', 'iOS', 'Android', 'Firebase'],
      interests: ['Bicycle', 'Gaming', 'Movies', 'Turkish Tea'],
      experience: '6+ years',
      mentoringStyle: 'Cross-platform expertise with cultural sensitivity'
    },
    {
      email: 'nino.kvantaliani@company.com',
      firstName: 'Nino',
      lastName: 'Kvantaliani',
      department: 'Engineering',
      position: 'Frontend Developer',
      location: 'Tbilisi, Georgia',
      techStack: ['React', 'Vue.js', 'TypeScript', 'Webpack', 'SASS'],
      interests: ['Hiking', 'Photography', 'Georgian Cuisine', 'Art'],
      experience: '4+ years',
      mentoringStyle: 'Creative problem-solving with visual focus'
    },
    {
      email: 'oleksandr.kovalenko@company.com',
      firstName: 'Oleksandr',
      lastName: 'Kovalenko',
      department: 'Engineering',
      position: 'Cloud Engineer',
      location: 'Kyiv, Ukraine',
      techStack: ['AWS', 'Azure', 'Docker', 'Kubernetes', 'Terraform'],
      interests: ['Bicycle', 'Gaming', 'Movies', 'Ukrainian Culture'],
      experience: '9+ years',
      mentoringStyle: 'Resilient and adaptable with strong technical foundation'
    },
    // AI and Machine Learning specialists
    {
      email: 'sophie.chen@company.com',
      firstName: 'Sophie',
      lastName: 'Chen',
      department: 'AI Research',
      position: 'AI Engineer',
      location: 'London, UK',
      techStack: ['Python', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision'],
      interests: ['Movies', 'Reading', 'Chess', 'Tea'],
      experience: '6+ years',
      mentoringStyle: 'Research-oriented with practical applications'
    },
    {
      email: 'raj.patel@company.com',
      firstName: 'Raj',
      lastName: 'Patel',
      department: 'AI Research',
      position: 'Machine Learning Engineer',
      location: 'Berlin, Germany',
      techStack: ['Python', 'Scikit-learn', 'MLOps', 'Docker', 'Kubernetes'],
      interests: ['Bicycle', 'Hiking', 'Cooking', 'Board Games'],
      experience: '5+ years',
      mentoringStyle: 'Systematic and thorough with real-world examples'
    },
    // Cloud and DevOps specialists
    {
      email: 'lisa.andersson@company.com',
      firstName: 'Lisa',
      lastName: 'Andersson',
      department: 'DevOps',
      position: 'Cloud Architect',
      location: 'Stockholm, Sweden',
      techStack: ['AWS', 'GCP', 'Terraform', 'Ansible', 'Jenkins'],
      interests: ['Hiking', 'Skiing', 'Photography', 'Nordic Culture'],
      experience: '10+ years',
      mentoringStyle: 'Architectural thinking with scalability focus'
    },
    {
      email: 'pierre.martin@company.com',
      firstName: 'Pierre',
      lastName: 'Martin',
      department: 'DevOps',
      position: 'Site Reliability Engineer',
      location: 'Paris, France',
      techStack: ['Docker', 'Kubernetes', 'Prometheus', 'Grafana', 'Go'],
      interests: ['Bicycle', 'Wine', 'Movies', 'French Cuisine'],
      experience: '7+ years',
      mentoringStyle: 'Reliability-focused with monitoring expertise'
    },
    // Java specialists
    {
      email: 'hans.mueller@company.com',
      firstName: 'Hans',
      lastName: 'Müller',
      department: 'Engineering',
      position: 'Java Architect',
      location: 'Munich, Germany',
      techStack: ['Java', 'Spring', 'Microservices', 'Kafka', 'Redis'],
      interests: ['Hiking', 'Beer', 'Gaming', 'Classical Music'],
      experience: '12+ years',
      mentoringStyle: 'Enterprise-grade solutions with best practices'
    },
    {
      email: 'yuki.tanaka@company.com',
      firstName: 'Yuki',
      lastName: 'Tanaka',
      department: 'Engineering',
      position: 'Senior Java Developer',
      location: 'Tokyo, Japan',
      techStack: ['Java', 'Spring Boot', 'Hibernate', 'MySQL', 'Maven'],
      interests: ['Bicycle', 'Anime', 'Gaming', 'Japanese Culture'],
      experience: '8+ years',
      mentoringStyle: 'Detail-oriented with quality focus'
    },
    // Frontend specialists
    {
      email: 'emma.thompson@company.com',
      firstName: 'Emma',
      lastName: 'Thompson',
      department: 'Engineering',
      position: 'Frontend Lead',
      location: 'Dublin, Ireland',
      techStack: ['React', 'Next.js', 'TypeScript', 'GraphQL', 'Jest'],
      interests: ['Hiking', 'Photography', 'Irish Music', 'Pub Culture'],
      experience: '9+ years',
      mentoringStyle: 'User-centric with performance optimization'
    },
    {
      email: 'alex.kim@company.com',
      firstName: 'Alex',
      lastName: 'Kim',
      department: 'Engineering',
      position: 'UI/UX Developer',
      location: 'Seoul, South Korea',
      techStack: ['React', 'Vue.js', 'Figma', 'Storybook', 'CSS-in-JS'],
      interests: ['Gaming', 'K-Pop', 'Movies', 'Korean Cuisine'],
      experience: '6+ years',
      mentoringStyle: 'Design-system focused with accessibility emphasis'
    },
    // Backend specialists
    {
      email: 'marcus.silva@company.com',
      firstName: 'Marcus',
      lastName: 'Silva',
      department: 'Engineering',
      position: 'Backend Developer',
      location: 'São Paulo, Brazil',
      techStack: ['Node.js', 'Express', 'PostgreSQL', 'Redis', 'Docker'],
      interests: ['Bicycle', 'Soccer', 'Brazilian Music', 'Beach Volleyball'],
      experience: '5+ years',
      mentoringStyle: 'Energetic and collaborative with cultural diversity'
    },
    {
      email: 'priya.sharma@company.com',
      firstName: 'Priya',
      lastName: 'Sharma',
      department: 'Engineering',
      position: 'Full Stack Developer',
      location: 'Bangalore, India',
      techStack: ['React', 'Node.js', 'MongoDB', 'AWS', 'Docker'],
      interests: ['Yoga', 'Indian Classical Music', 'Movies', 'Spicy Food'],
      experience: '7+ years',
      mentoringStyle: 'Holistic approach with mindfulness integration'
    },
    // Specialized roles
    {
      email: 'david.wright@company.com',
      firstName: 'David',
      lastName: 'Wright',
      department: 'Security',
      position: 'Security Engineer',
      location: 'Amsterdam, Netherlands',
      techStack: ['Python', 'Security Tools', 'Penetration Testing', 'OWASP', 'Docker'],
      interests: ['Hiking', 'Cycling', 'Chess', 'Dutch Culture'],
      experience: '8+ years',
      mentoringStyle: 'Security-first mindset with practical demonstrations'
    },
    {
      email: 'sarah.oconnor@company.com',
      firstName: 'Sarah',
      lastName: "O'Connor",
      department: 'Data Engineering',
      position: 'Data Engineer',
      location: 'Melbourne, Australia',
      techStack: ['Python', 'Apache Spark', 'Kafka', 'Airflow', 'PostgreSQL'],
      interests: ['Hiking', 'Surfing', 'Coffee', 'Australian Rules Football'],
      experience: '6+ years',
      mentoringStyle: 'Data pipeline expertise with scalability focus'
    },
    {
      email: 'viktor.novak@company.com',
      firstName: 'Viktor',
      lastName: 'Novák',
      department: 'Engineering',
      position: 'Mobile Developer',
      location: 'Prague, Czech Republic',
      techStack: ['React Native', 'Flutter', 'iOS', 'Android', 'Firebase'],
      interests: ['Bicycle', 'Beer', 'Gaming', 'Czech Culture'],
      experience: '5+ years',
      mentoringStyle: 'Cross-platform development with performance focus'
    },
    {
      email: 'elena.volkova@company.com',
      firstName: 'Elena',
      lastName: 'Volkova',
      department: 'Engineering',
      position: 'Backend Developer',
      location: 'Moscow, Russia',
      techStack: ['Go', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes'],
      interests: ['Hiking', 'Classical Music', 'Reading', 'Russian Literature'],
      experience: '8+ years',
      mentoringStyle: 'High-performance systems with Russian engineering precision'
    }
  ];

  for (const buddyData of buddyUsers) {
    const password = await bcrypt.hash('password123', 12);
    
    const user = await prisma.user.upsert({
      where: { email: buddyData.email },
      update: {},
      create: {
        email: buddyData.email,
        password,
        firstName: buddyData.firstName,
        lastName: buddyData.lastName,
        role: 'BUDDY',
        profile: {
          create: {
            department: buddyData.department,
            position: buddyData.position,
            location: buddyData.location,
            bio: `Experienced ${buddyData.position} passionate about helping others grow.`,
            interests: buddyData.interests,
            languages: ['English']
          }
        },
        buddyProfile: {
          create: {
            location: buddyData.location,
            unit: buddyData.department,
            techStack: buddyData.techStack,
            interests: buddyData.interests,
            maxBuddies: 3,
            isAvailable: true,
            experience: buddyData.experience,
            mentoringStyle: buddyData.mentoringStyle
          }
        }
      }
    });
  }

  // Create newcomer users
  const newcomerUsers = [
    {
      email: 'alex.newcomer@company.com',
      firstName: 'Alex',
      lastName: 'Newcomer',
      department: 'Engineering',
      position: 'Junior Developer',
      startDate: new Date('2024-02-01')
    },
    {
      email: 'sam.junior@company.com',
      firstName: 'Sam',
      lastName: 'Junior',
      department: 'Marketing',
      position: 'Marketing Coordinator',
      startDate: new Date('2024-02-15')
    }
  ];

  for (const newcomerData of newcomerUsers) {
    const password = await bcrypt.hash('password123', 12);
    
    await prisma.user.upsert({
      where: { email: newcomerData.email },
      update: {},
      create: {
        email: newcomerData.email,
        password,
        firstName: newcomerData.firstName,
        lastName: newcomerData.lastName,
        role: 'NEWCOMER',
        profile: {
          create: {
            department: newcomerData.department,
            position: newcomerData.position,
            startDate: newcomerData.startDate,
            bio: 'Excited to start my journey at the company!',
            interests: ['Learning', 'Networking', 'Growth'],
            languages: ['English']
          }
        }
      }
    });
  }


  console.log('✅ Database seeded successfully!');
  console.log(`\n📋 Generated ${buddyUsers.length} buddy profiles with diverse locations, tech stacks, and interests!`);
  console.log('\n📋 Test Accounts:');
  console.log('HR: hr@company.com / password123');
  console.log('Buddy: john.doe@company.com / password123');
  console.log('Newcomer: alex.newcomer@company.com / password123');
  console.log('\n🌍 Buddy Locations: Europe (Serbia, Bulgaria, Spain), Turkey, Georgia, Ukraine, and more!');
  console.log('💻 Tech Stacks: Java, AI/ML, Cloud, DevOps, Frontend, Backend, Mobile, Security, Data Engineering');
  console.log('🎯 Interests: Bicycle, Hiking, Movies, PlayStation, Gaming, Photography, Coffee, and more!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
