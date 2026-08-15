import json
import os

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "question_bank")

# Authoritative Curriculums
PHYSICS_CURRICULUM = {
    "Units & Measurements": ["Units and Dimensions", "Significant Figures", "Errors in Measurement", "Dimensional Analysis"],
    "Kinematics": ["Motion in a Straight Line", "Motion in a Plane", "Projectile Motion", "Uniform Circular Motion"],
    "Laws of Motion": ["Newton's Laws of Motion", "Momentum and Impulse", "Friction", "Circular Motion"],
    "Work, Energy & Power": ["Work and Kinetic Energy", "Potential Energy", "Work-Energy Theorem", "Conservation of Energy", "Power"],
    "Rotational Motion": ["Centre of Mass", "Torque and Angular Momentum", "Moment of Inertia", "Rotational Dynamics", "Rolling Motion"],
    "Gravitation": ["Universal Law of Gravitation", "Gravitational Field and Potential", "Satellites", "Escape Velocity", "Kepler's Laws"],
    "Properties of Matter": ["Elasticity", "Fluid Pressure and Viscosity", "Surface Tension", "Fluid Dynamics", "Thermal Properties of Matter"],
    "Thermodynamics": ["Thermal Equilibrium and Temperature", "First Law of Thermodynamics", "Thermodynamic Processes", "Second Law of Thermodynamics", "Heat Engines and Refrigerators"],
    "Kinetic Theory of Gases": ["Kinetic Theory of Gases", "Pressure and Temperature of a Gas", "RMS Speed", "Degrees of Freedom", "Law of Equipartition of Energy"],
    "Oscillations & Waves": ["Simple Harmonic Motion", "Energy in SHM", "Simple Pendulum", "Wave Motion", "Superposition and Standing Waves", "Sound Waves and Doppler Effect"],
    "Electrostatics": ["Electric Charges and Coulomb's Law", "Electric Field and Electric Dipole", "Electric Flux and Gauss's Law", "Electric Potential", "Capacitance and Capacitors"],
    "Current Electricity": ["Electric Current and Drift Velocity", "Ohm's Law and Resistance", "Combination of Resistors", "Kirchhoff's Laws", "Wheatstone Bridge and Metre Bridge", "Cells and Internal Resistance"],
    "Magnetic Effects of Current & Magnetism": ["Magnetic Field and Biot-Savart Law", "Ampere's Law", "Force on Moving Charges and Current-Carrying Conductors", "Torque on Current Loop", "Moving Coil Galvanometer", "Magnetic Properties of Matter"],
    "Electromagnetic Induction & AC": ["Electromagnetic Induction", "Faraday's and Lenz's Laws", "Self and Mutual Inductance", "Alternating Current", "LCR Circuits and Resonance", "AC Generator and Transformer"],
    "Electromagnetic Waves": ["Displacement Current", "Electromagnetic Waves", "Properties of Electromagnetic Waves", "Electromagnetic Spectrum"],
    "Optics": ["Ray Optics", "Optical Instruments", "Wave Optics", "Interference", "Diffraction", "Polarisation"],
    "Dual Nature of Matter & Radiation": ["Photoelectric Effect", "Einstein's Photoelectric Equation", "Matter Waves", "de Broglie Wavelength"],
    "Atoms & Nuclei": ["Atomic Models", "Bohr's Model", "Hydrogen Spectrum", "Nuclear Physics", "Radioactivity", "Nuclear Fission and Fusion"],
    "Electronic Devices": ["Semiconductors", "p-n Junction Diode", "Rectifiers", "Zener Diode", "LED, Photodiode and Solar Cell", "Logic Gates"]
}

CHEMISTRY_CURRICULUM = {
    "Some Basic Concepts of Chemistry": ["Mole Concept", "Molar Mass", "Stoichiometry", "Empirical & Molecular Formula"],
    "Atomic Structure": ["Bohr Model", "Quantum Numbers", "Electronic Configuration", "Photoelectric Effect"],
    "Classification of Elements & Periodicity": ["Periodic Trends", "Ionization Enthalpy", "Electron Gain Enthalpy", "Electronegativity"],
    "Chemical Bonding & Molecular Structure": ["Ionic & Covalent Bonding", "VSEPR Theory", "Hybridization", "Molecular Orbital Theory"],
    "States of Matter": ["Boyle's & Charles's Law", "Ideal Gas Equation", "Dalton's Law", "Intermolecular Forces"],
    "Thermodynamics": ["First Law of Thermodynamics", "Enthalpy", "Hess's Law", "Gibbs Free Energy & Spontaneity"],
    "Equilibrium": ["Law of Mass Action", "Le Chatelier's Principle", "pH and Buffers", "Solubility Product"],
    "Redox Reactions & Electrochemistry": ["Oxidation Numbers", "Galvanic Cells", "Nernst Equation", "Kohlrausch's Law"],
    "Solutions": ["Raoult's Law", "Colligative Properties", "Van't Hoff Factor", "Henry's Law"],
    "Chemical Kinetics": ["Rate Law", "Order & Molecularity", "Arrhenius Equation", "Half-Life"],
    "Surface Chemistry": ["Adsorption Isotherms", "Catalysis", "Colloids & Emulsions", "Tyndall Effect"],
    "p-Block Elements": ["Group 13 & 14 Elements", "Group 15 Elements", "Group 16 Elements", "Halogens & Noble Gases"],
    "d- and f-Block Elements": ["Transition Elements", "Lanthanoids & Actinoids", "Potassium Permanganate", "Potassium Dichromate"],
    "Coordination Compounds": ["Werner's Theory", "IUPAC Naming", "Valence Bond Theory", "Crystal Field Theory"],
    "Organic Chemistry — Basic Principles": ["IUPAC Nomenclature", "Isomerism", "Inductive & Resonance Effects", "Hyperconjugation"],
    "Hydrocarbons": ["Alkanes", "Alkenes", "Alkynes", "Aromatic Hydrocarbons & Electrophilic Substitution"],
    "Organic Compounds Containing Halogens": ["SN1 & SN2 Reactions", "Haloalkanes", "Haloarenes", "Polyhalogen Compounds"],
    "Organic Compounds Containing Oxygen": ["Alcohols & Phenols", "Ethers", "Aldehydes & Ketones", "Carboxylic Acids"],
    "Organic Compounds Containing Nitrogen": ["Amines", "Diazonium Salts", "Basicity of Amines", "Preparation of Amines"],
    "Biomolecules": ["Carbohydrates", "Proteins & Amino Acids", "Nucleic Acids", "Vitamins & Enzymes"],
    "Polymers": ["Addition & Condensation Polymers", "Rubber", "Biodegradable Polymers", "Commercial Polymers"],
    "Chemistry in Everyday Life": ["Drugs & Medicines", "Cleansing Agents", "Food Additives", "Antiseptics & Disinfectants"]
}

BIOLOGY_CURRICULUM = {
    "The Living World": ["What is Living?", "Taxonomic Hierarchy", "Binomial Nomenclature"],
    "Biological Classification": ["Five Kingdom Classification", "Monera", "Protista", "Fungi", "Viruses & Viroids"],
    "Plant Kingdom": ["Algae", "Bryophytes", "Pteridophytes", "Gymnosperms", "Angiosperms"],
    "Animal Kingdom": ["Non-Chordates", "Chordates", "Classes of Vertebrates"],
    "Morphology of Flowering Plants": ["Root, Stem, Leaf", "Inflorescence & Flower", "Fruit & Seed"],
    "Anatomy of Flowering Plants": ["Meristematic & Permanent Tissues", "Dicot & Monocot Anatomy", "Secondary Growth"],
    "Structural Organisation in Animals": ["Animal Tissues", "Cockroach Anatomy", "Frog Anatomy"],
    "Cell: The Unit of Life": ["Prokaryotic vs Eukaryotic Cell", "Cell Membrane & Wall", "Endomembrane System", "Mitochondria & Chloroplasts"],
    "Biomolecules": ["Carbohydrates & Lipids", "Proteins & Nucleic Acids", "Enzyme Kinetics"],
    "Cell Cycle & Cell Division": ["Mitosis", "Meiosis", "Cell Cycle Phases"],
    "Transport in Plants": ["Water Potential", "Transpiration Pull", "Phloem Transport"],
    "Mineral Nutrition": ["Essential Minerals", "Nitrogen Cycle", "Deficiency Symptoms"],
    "Photosynthesis in Plants": ["Light Reactions", "Calvin Cycle (C3)", "Hatch-Slack Pathway (C4)", "Photorespiration"],
    "Respiration in Plants": ["Glycolysis", "Kreb's Cycle", "Electron Transport System", "Fermentation"],
    "Plant Growth & Development": ["Auxins & Gibberellins", "Cytokinins & Ethylene", "Photoperiodism"],
    "Digestion & Absorption": ["Digestive System", "Digestion of Food", "Absorption & Assimilation"],
    "Breathing & Exchange of Gases": ["Respiratory Organs", "Mechanism of Breathing", "Gas Transport & Regulation"],
    "Body Fluids & Circulation": ["Blood Components", "Human Heart & Cardiac Cycle", "ECG & Blood Pressure"],
    "Excretory Products & Elimination": ["Structure of Nephron", "Urine Formation", "Regulation of Kidney Function"],
    "Locomotion & Movement": ["Types of Movement", "Skeletal System", "Joints & Muscle Contraction"],
    "Neural Control & Coordination": ["Neuron Structure", "Central Nervous System", "Reflex Arc & Sense Organs"],
    "Chemical Coordination & Integration": ["Endocrine Glands", "Hormones & Mechanism of Action"],
    "Sexual Reproduction in Flowering Plants": ["Microsporogenesis & Megasporogenesis", "Pollination", "Double Fertilisation"],
    "Human Reproduction": ["Male Reproductive System", "Female Reproductive System", "Gametogenesis & Menstrual Cycle"],
    "Reproductive Health": ["Contraceptive Methods", "STIs & Infertility (ART)"],
    "Principles of Inheritance & Variation": ["Mendelian Genetics", "Inheritance Patterns", "Genetic Disorders"],
    "Molecular Basis of Inheritance": ["DNA & RNA Structure", "Replication & Transcription", "Genetic Code & Translation", "Operon Concept"],
    "Evolution": ["Origin of Life", "Evidences of Evolution", "Hardy-Weinberg Principle", "Human Evolution"],
    "Human Health & Disease": ["Common Diseases", "Immunity & Vaccination", "AIDS & Cancer", "Drugs & Alcohol Abuse"],
    "Microbes in Human Welfare": ["Microbes in Household & Industry", "Sewage Treatment", "Biocontrol Agents & Biofertilisers"],
    "Biotechnology: Principles & Processes": ["Recombinant DNA Technology", "Restriction Enzymes", "PCR & Vectors"],
    "Biotechnology & Its Applications": ["Bt Cotton & Pest Resistance", "Gene Therapy & Insulin", "Transgenic Animals"],
    "Organisms & Populations": ["Organism & Environment", "Population Attributes", "Population Interactions"],
    "Ecosystem": ["Ecosystem Structure & Function", "Energy Flow & Ecological Pyramids", "Nutrient Cycling"],
    "Biodiversity & Conservation": ["Levels of Biodiversity", "Loss of Biodiversity", "In-situ & Ex-situ Conservation"],
    "Environmental Issues": ["Air & Water Pollution", "Solid & Radioactive Waste", "Global Warming & Ozone Depletion"]
}

MATHEMATICS_CURRICULUM = {
    "Sets, Relations & Functions": ["Sets & Venn Diagrams", "Relations & Types", "Functions & Domain/Range", "Composite & Inverse Functions"],
    "Complex Numbers & Quadratic Equations": ["Complex Number Algebra", "Modulus & Argument", "Quadratic Roots & Discriminant", "Cube Roots of Unity"],
    "Matrices & Determinants": ["Matrix Operations", "Determinant Evaluation", "Inverse of Matrix", "System of Linear Equations (Cramer's Rule)"],
    "Permutations & Combinations": ["Fundamental Principle of Counting", "Permutations with Repetition", "Combinations & Selection", "Circular Permutations"],
    "Binomial Theorem": ["Binomial Expansion", "General & Middle Term", "Properties of Binomial Coefficients"],
    "Sequences & Series": ["Arithmetic Progression (AP)", "Geometric Progression (GP)", "Harmonic Progression & AGP", "Sum of Special Series"],
    "Limits, Continuity & Differentiability": ["Evaluation of Limits (L'Hopital)", "Continuity at a Point", "Differentiability & Chain Rule"],
    "Integral Calculus": ["Indefinite Integration Techniques", "Definite Integral Properties", "Area Under Curves"],
    "Differential Equations": ["Order & Degree", "Variable Separable Form", "Linear Differential Equations"],
    "Coordinate Geometry": ["Straight Lines & Angle Between Them", "Circles & Tangents", "Parabola", "Ellipse & Hyperbola"],
    "Three Dimensional Geometry": ["Direction Cosines & Ratios", "Line Equations in 3D", "Plane Equations", "Distance Between Lines"],
    "Vector Algebra": ["Vector Operations & Magnitude", "Dot Product & Projection", "Cross Product & Area", "Scalar & Vector Triple Product"],
    "Statistics & Probability": ["Mean, Variance & Standard Deviation", "Classical & Conditional Probability", "Bayes' Theorem", "Binomial Distribution"],
    "Trigonometry": ["Trigonometric Ratios & Identities", "Trigonometric Equations", "Inverse Trigonometric Functions", "Properties of Triangles"]
}

print("Curriculum mappings ready.")
