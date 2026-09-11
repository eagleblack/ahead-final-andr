export const examTypes = ['DGD', 'MCA', 'UK'];
export const classTypes = ['MEO CLASS 1', 'MEO CLASS 2'];

export const subjectsData = {
  defaultSubjects: [
    {
      id: 'sub1',
      title: 'Motor Control Engineering',
      icon: 'cogs',
      topicsCount: 3,
    },
    {
      id: 'sub2',
      title: 'Auxiliary System',
      icon: 'tools',
      topicsCount: 3,
    },
    {
      id: 'sub3',
      title: 'Steam Boiler & Turbines',
      icon: 'hot-tub',
      topicsCount: 2,
    },
    {
      id: 'sub4',
      title: 'Ship Safety & Environment',
      icon: 'shield-alt',
      topicsCount: 2,
    },
  ]
};

export const topicsData = {
  'sub1': [
    { id: 't1_1', title: 'Camshaft & Chain Drive', questionCount: 3 },
    { id: 't1_2', title: 'Compressed Air System', questionCount: 2 },
    { id: 't1_3', title: 'Cooling System & FWG', questionCount: 2 },
  ],
  'sub2': [
    { id: 't2_1', title: 'Pumps & Bilge Systems', questionCount: 2 },
    { id: 't2_2', title: 'Sewage Treatment Plant', questionCount: 2 },
    { id: 't2_3', title: 'Steering Gear & Rudder', questionCount: 2 },
  ],
  'sub3': [
    { id: 't3_1', title: 'Boiler Water Treatment', questionCount: 2 },
    { id: 't3_2', title: 'Steam Turbines & Condensers', questionCount: 2 },
  ],
  'sub4': [
    { id: 't4_1', title: 'Fire Fighting Appliances', questionCount: 2 },
    { id: 't4_2', title: 'Life Saving Appliances (LSA)', questionCount: 2 },
  ]
};

export const questionsData = {
  // COC mode questions (includes long paragraphs for blog details)
  coc: {
    't1_1': [
      {
        id: 'q_coc_1',
        question: 'Explain the visual inspection process of a camshaft drive chain tensioner.',
        answer: 'Visual inspection involves checking the chain slack, checking if the tensioner piston has reached its limit of travel, looking for any signs of cracking or wear on the guide rails, and checking for any scored pins or link plates.',
        year: 'Asked in 2024'
      },
      {
        id: 'q_coc_2',
        question: 'What are the common causes of camshaft chain elongation in large 2-stroke engines?',
        answer: 'Chain elongation is primarily caused by abrasive wear between the pin and bushing, insufficient or dirty lubrication, excessive dynamic loads due to torsional vibrations, or incorrect initial tensioning.',
        year: 'Asked in 2023'
      },
      {
        id: 'q_coc_3',
        question: 'Explain the procedure to adjust the tension of a camshaft drive chain.',
        answer: '1. Turn the engine so all slack is on the tensioner side.\n2. Slacken the locknuts and adjust the tensioning screw until the correct spring length is achieved.\n3. Measure the chain deflection to confirm it matches manufacturer specifications.\n4. Tighten the locknuts and secure the locking plates.',
        year: 'Asked in 2021'
      }
    ],
    't1_2': [
      {
        id: 'q_coc_4',
        question: 'State the common reasons for an explosion in the main air compressor discharge line.',
        answer: 'Explosions are caused by the accumulation of lube oil carryover in the discharge piping forming explosive mist/vapors with high temperature air, often combined with a leaking discharge valve that re-compresses hot air, sparking carbon deposits.',
        year: 'Asked in 2024'
      },
      {
        id: 'q_coc_5',
        question: 'Describe the function and safety features of a starting air receiver.',
        answer: 'A starting air receiver stores compressed air at high pressure (typically 30 bar). Safety features include a relief valve to prevent overpressure, a drain valve to regularly remove condensed moisture and oil, a fusible plug that melts at high temperatures, and a non-return valve at the inlet.',
        year: 'Asked in 2022'
      }
    ],
    't1_3': [
      {
        id: 'q_coc_6',
        question: 'How does a Fresh Water Generator (FWG) maintain low boiling temperature under vacuum?',
        answer: 'FWG uses an ejector (water or steam air ejector) to create a high vacuum (~93% vacuum) inside the chamber. Under this low pressure, water boils at around 40-45°C. This allows utilizing low-temperature jacket cooling water (around 80°C) as the heat source.',
        year: 'Asked in 2023'
      },
      {
        id: 'q_coc_7',
        question: 'What are the causes of high salinity in the output fresh water of a generator?',
        answer: 'Causes include: 1. Leaking condenser tubes.\n2. Over-feeding of sea water causing foaming or priming.\n3. Defective shell vacuum (boiling temperature too high).\n4. Faulty solenoid valve or salinity sensor.',
        year: 'Asked in 2022'
      }
    ]
  },

  // Interview mode questions (Interactive MCQ, FIB, and Flashcard data)
  // Per user instruction: No explanations are required for the interview mode datasets.
  interview: {
    't1_1': [
      {
        id: 'q_int_1',
        question: 'What is the primary function of the camshaft in a 2-stroke marine diesel engine?',
        options: [
          'To control the fuel injection pump and exhaust valve timing',
          'To drive the alternator and starter motor',
          'To balance torsional vibration of the crankshaft',
          'To support the piston and crosshead guide'
        ],
        answer: 'To control the fuel injection pump and exhaust valve timing',
        year: 'Asked in 2024',
        fibQuestion: 'The primary function of the camshaft in a 2-stroke marine diesel engine is to control fuel injection and _____ timing.',
        fibAnswer: 'valve',
        flashcardFront: 'Primary function of the camshaft in 2-stroke marine diesel engine?',
        flashcardBack: 'Controls the fuel injection pump and exhaust valve timing.'
      },
      {
        id: 'q_int_2',
        question: 'How is camshaft chain elongation typically measured in practice?',
        options: [
          'By measuring chain slack deflection under a specified load',
          'Using a micrometric caliper on a single outer link',
          'Checking the cylinder peak pressure variations',
          'By monitoring lube oil return temperature'
        ],
        answer: 'By measuring chain slack deflection under a specified load',
        year: 'Asked in 2023',
        fibQuestion: 'Camshaft chain elongation is typically measured by checking chain _____ under a specified load.',
        fibAnswer: 'deflection',
        flashcardFront: 'How is camshaft chain elongation measured?',
        flashcardBack: 'By measuring the chain slack deflection under a specified load.'
      },
      {
        id: 'q_int_3',
        question: 'Which component dampens the vibrations of a camshaft drive chain?',
        options: [
          'Rubber-faced guide bars',
          'Torsional vibration damper',
          'Crankcase breather valve',
          'Thrust block bearings'
        ],
        answer: 'Rubber-faced guide bars',
        year: 'Asked in 2022',
        fibQuestion: 'The vibrations of a camshaft drive chain are dampened by rubber-faced _____ bars.',
        fibAnswer: 'guide',
        flashcardFront: 'Which component dampens camshaft drive chain vibrations?',
        flashcardBack: 'Rubber-faced guide bars.'
      }
    ],
    't1_2': [
      {
        id: 'q_int_4',
        question: 'What is the typical standard pressure rating for a main starting air bottle on merchant vessels?',
        options: [
          '30 bar',
          '10 bar',
          '100 bar',
          '7 bar'
        ],
        answer: '30 bar',
        year: 'Asked in 2024',
        fibQuestion: 'The standard pressure rating for a main starting air receiver is _____ bar.',
        fibAnswer: '30',
        flashcardFront: 'Typical standard starting air bottle pressure?',
        flashcardBack: '30 bar.'
      },
      {
        id: 'q_int_5',
        question: 'What is the purpose of the fusible plug installed on starting air receivers?',
        options: [
          'To release pressure in case of external fire or high temperature',
          'To drain accumulated lubricating oil automatically',
          'To prevent reverse flow of air to the compressor',
          'To monitor temperature changes electronically'
        ],
        answer: 'To release pressure in case of external fire or high temperature',
        year: 'Asked in 2023',
        fibQuestion: 'The fusible plug on a starting air bottle melts to release pressure in case of _____ fires.',
        fibAnswer: 'external',
        flashcardFront: 'Purpose of fusible plug on air receivers?',
        flashcardBack: 'Melts and releases high pressure in case of excessive heat or external fire.'
      }
    ],
    't1_3': [
      {
        id: 'q_int_6',
        question: 'At what temperature does sea water typically boil inside an FWG evaporator chamber under vacuum?',
        options: [
          '40°C - 45°C',
          '100°C',
          '75°C - 80°C',
          '15°C - 20°C'
        ],
        answer: '40°C - 45°C',
        year: 'Asked in 2024',
        fibQuestion: 'Under deep vacuum in a marine FWG, sea water boils at _____ to 45 degrees Celsius.',
        fibAnswer: '40',
        flashcardFront: 'Boiling point of sea water inside FWG vacuum chamber?',
        flashcardBack: 'Around 40°C - 45°C due to low pressure.'
      },
      {
        id: 'q_int_7',
        question: 'Which chemical is commonly dosed in FWG sea water feed to prevent scale formation?',
        options: [
          'Polyelectrolyte (Vaptreat)',
          'Sodium Hydroxide',
          'Hydrazine',
          'Sulphuric Acid'
        ],
        answer: 'Polyelectrolyte (Vaptreat)',
        year: 'Asked in 2023',
        fibQuestion: 'The common scale prevention chemical dosed into marine FWGs is called _____.',
        fibAnswer: 'vaptreat',
        flashcardFront: 'Chemical dosed in FWG to prevent scaling?',
        flashcardBack: 'Polyelectrolyte, commercially known as Vaptreat.'
      }
    ]
  }
};

export const getQuestionsForTopic = (mode, topicId) => {
  const dataset = mode === 'Interview' ? questionsData.interview : questionsData.coc;
  if (dataset[topicId]) {
    return dataset[topicId];
  }
  
  if (mode === 'Interview') {
    return [
      {
        id: `q_fallback_int_1_${topicId}`,
        question: 'Which of the following is a key maintenance task for auxiliary machinery?',
        options: [
          'Regular testing of safety alarms and relief valves',
          'Increasing oil viscosity beyond recommended limits',
          'Running continuously without cooling water flow',
          'Disabling high-pressure cut-off switches'
        ],
        answer: 'Regular testing of safety alarms and relief valves',
        year: 'Asked in 2024',
        fibQuestion: 'Regular testing of safety alarms and _____ valves is essential for auxiliary machinery.',
        fibAnswer: 'relief',
        flashcardFront: 'Key maintenance task for auxiliary systems?',
        flashcardBack: 'Testing alarm settings, trips, and relief valves.'
      }
    ];
  } else {
    return [
      {
        id: `q_fallback_coc_1_${topicId}`,
        question: 'Describe the operating principle and safety hazards associated with this machinery.',
        answer: 'The machinery operates by converting energy to perform work under high temperature or pressure. Hazards include high pressure fluid release, hot surfaces causing thermal burns, electrical shocks from controls, and mechanical hazards from moving parts. Proper insulation, lock-out tag-out (LOTO), and regular testing of relief devices are critical.',
        year: 'Asked in 2024'
      }
    ];
  }
};
