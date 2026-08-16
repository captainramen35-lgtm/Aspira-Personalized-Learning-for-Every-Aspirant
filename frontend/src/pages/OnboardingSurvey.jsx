import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import {
  GraduationCap,
  BookOpen,
  Target,
  Brain,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Lightbulb
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const SYLLABUS = {
  JEE: {
    Physics: {
      "Units & Measurements": [
        "Units and Dimensions",
        "Significant Figures",
        "Errors in Measurement",
        "Dimensional Analysis"
      ],

      "Kinematics": [
        "Motion in a Straight Line",
        "Motion in a Plane",
        "Projectile Motion",
        "Uniform Circular Motion"
      ],

      "Laws of Motion": [
        "Newton's Laws of Motion",
        "Momentum and Impulse",
        "Friction",
        "Circular Motion"
      ],

      "Work, Energy & Power": [
        "Work and Kinetic Energy",
        "Potential Energy",
        "Work-Energy Theorem",
        "Conservation of Energy",
        "Power"
      ],

      "Rotational Motion": [
        "Centre of Mass",
        "Torque and Angular Momentum",
        "Moment of Inertia",
        "Rotational Dynamics",
        "Rolling Motion"
      ],

      "Gravitation": [
        "Universal Law of Gravitation",
        "Gravitational Field and Potential",
        "Satellites",
        "Escape Velocity",
        "Kepler's Laws"
      ],

      "Properties of Matter": [
        "Elasticity",
        "Fluid Pressure and Viscosity",
        "Surface Tension",
        "Fluid Dynamics",
        "Thermal Properties of Matter"
      ],

      "Thermodynamics": [
        "Thermal Equilibrium and Temperature",
        "First Law of Thermodynamics",
        "Thermodynamic Processes",
        "Second Law of Thermodynamics",
        "Heat Engines and Refrigerators"
      ],

      "Kinetic Theory of Gases": [
        "Kinetic Theory of Gases",
        "Pressure and Temperature of a Gas",
        "RMS Speed",
        "Degrees of Freedom",
        "Law of Equipartition of Energy"
      ],

      "Oscillations & Waves": [
        "Simple Harmonic Motion",
        "Energy in SHM",
        "Simple Pendulum",
        "Wave Motion",
        "Superposition and Standing Waves",
        "Sound Waves and Doppler Effect"
      ],

      "Electrostatics": [
        "Electric Charges and Coulomb's Law",
        "Electric Field and Electric Dipole",
        "Electric Flux and Gauss's Law",
        "Electric Potential",
        "Capacitance and Capacitors"
      ],

      "Current Electricity": [
        "Electric Current and Drift Velocity",
        "Ohm's Law and Resistance",
        "Combination of Resistors",
        "Kirchhoff's Laws",
        "Wheatstone Bridge and Metre Bridge",
        "Cells and Internal Resistance"
      ],

      "Magnetic Effects of Current & Magnetism": [
        "Magnetic Field and Biot-Savart Law",
        "Ampere's Law",
        "Force on Moving Charges and Current-Carrying Conductors",
        "Torque on Current Loop",
        "Moving Coil Galvanometer",
        "Magnetic Properties of Matter"
      ],

      "Electromagnetic Induction & AC": [
        "Electromagnetic Induction",
        "Faraday's and Lenz's Laws",
        "Self and Mutual Inductance",
        "Alternating Current",
        "LCR Circuits and Resonance",
        "AC Generator and Transformer"
      ],

      "Electromagnetic Waves": [
        "Displacement Current",
        "Electromagnetic Waves",
        "Properties of Electromagnetic Waves",
        "Electromagnetic Spectrum"
      ],

      "Optics": [
        "Ray Optics",
        "Optical Instruments",
        "Wave Optics",
        "Interference",
        "Diffraction",
        "Polarisation"
      ],

      "Dual Nature of Matter & Radiation": [
        "Photoelectric Effect",
        "Einstein's Photoelectric Equation",
        "Matter Waves",
        "de Broglie Wavelength"
      ],

      "Atoms & Nuclei": [
        "Atomic Models",
        "Bohr's Model",
        "Hydrogen Spectrum",
        "Nuclear Physics",
        "Radioactivity",
        "Nuclear Fission and Fusion"
      ],

      "Electronic Devices": [
        "Semiconductors",
        "p-n Junction Diode",
        "Rectifiers",
        "Zener Diode",
        "LED, Photodiode and Solar Cell",
        "Logic Gates"
      ]
    },
    Chemistry: {
      "Some Basic Concepts of Chemistry": [
        "Mole Concept",
        "Atomic and Molecular Masses",
        "Stoichiometry",
        "Percentage Composition",
        "Empirical and Molecular Formula"
      ],

      "Atomic Structure": [
        "Nature of Electromagnetic Radiation",
        "Bohr's Atomic Model",
        "Quantum Numbers",
        "Electronic Configuration",
        "Atomic Orbitals"
      ],

      "Classification of Elements & Periodicity": [
        "Periodic Table",
        "Periodic Law",
        "Atomic Radius",
        "Ionization Enthalpy",
        "Electron Gain Enthalpy",
        "Valency and Chemical Properties"
      ],

      "Chemical Bonding & Molecular Structure": [
        "Ionic Bonding",
        "Covalent Bonding",
        "Lewis Structures",
        "VSEPR Theory",
        "Hybridization",
        "Molecular Orbital Theory"
      ],

      "States of Matter": [
        "Gaseous State",
        "Gas Laws",
        "Kinetic Theory of Gases",
        "Ideal and Real Gases",
        "Liquid State"
      ],

      "Thermodynamics": [
        "System and Surroundings",
        "First Law of Thermodynamics",
        "Enthalpy",
        "Hess's Law",
        "Entropy",
        "Gibbs Free Energy"
      ],

      "Equilibrium": [
        "Chemical Equilibrium",
        "Equilibrium Constant",
        "Le Chatelier's Principle",
        "Ionic Equilibrium",
        "Acids and Bases",
        "Solubility Equilibrium"
      ],

      "Redox Reactions & Electrochemistry": [
        "Oxidation and Reduction",
        "Oxidation Number",
        "Balancing Redox Reactions",
        "Electrochemical Cells",
        "Electrode Potential",
        "Electrolysis"
      ],

      "Solutions": [
        "Types of Solutions",
        "Concentration Terms",
        "Solubility",
        "Raoult's Law",
        "Colligative Properties",
        "Abnormal Molar Mass"
      ],

      "Chemical Kinetics": [
        "Rate of Reaction",
        "Factors Affecting Reaction Rate",
        "Rate Law",
        "Order and Molecularity",
        "Integrated Rate Equations",
        "Arrhenius Equation"
      ],

      "Surface Chemistry": [
        "Adsorption",
        "Types of Adsorption",
        "Catalysis",
        "Colloids",
        "Emulsions"
      ],

      "p-Block Elements": [
        "Group 13 Elements",
        "Group 14 Elements",
        "Group 15 Elements",
        "Group 16 Elements",
        "Group 17 Elements",
        "Group 18 Elements"
      ],

      "d- and f-Block Elements": [
        "Transition Elements",
        "Electronic Configuration",
        "Oxidation States",
        "Magnetic Properties",
        "Coordination Behaviour",
        "Lanthanides and Actinides"
      ],

      "Coordination Compounds": [
        "Coordination Entities",
        "Ligands and Coordination Number",
        "Nomenclature",
        "Isomerism",
        "Bonding in Coordination Compounds",
        "Applications of Coordination Compounds"
      ],

      "Organic Chemistry — Basic Principles": [
        "Structure and Bonding",
        "Organic Nomenclature",
        "Isomerism",
        "Electronic Effects",
        "Reaction Intermediates",
        "Types of Organic Reactions"
      ],

      "Hydrocarbons": [
        "Alkanes",
        "Alkenes",
        "Alkynes",
        "Aromatic Hydrocarbons",
        "Conformations",
        "Important Reactions"
      ],

      "Organic Compounds Containing Halogens": [
        "Haloalkanes",
        "Haloarenes",
        "Preparation of Halo Compounds",
        "Nucleophilic Substitution",
        "Elimination Reactions",
        "Uses and Environmental Effects"
      ],

      "Organic Compounds Containing Oxygen": [
        "Alcohols",
        "Phenols",
        "Ethers",
        "Aldehydes",
        "Ketones",
        "Carboxylic Acids"
      ],

      "Organic Compounds Containing Nitrogen": [
        "Amines",
        "Basicity of Amines",
        "Preparation of Amines",
        "Diazonium Salts",
        "Chemical Reactions of Amines"
      ],

      "Biomolecules": [
        "Carbohydrates",
        "Proteins",
        "Amino Acids",
        "Enzymes",
        "Nucleic Acids",
        "Vitamins"
      ],

      "Polymers": [
        "Classification of Polymers",
        "Addition Polymers",
        "Condensation Polymers",
        "Important Synthetic Polymers",
        "Biodegradable Polymers"
      ],

      "Chemistry in Everyday Life": [
        "Drugs and Medicines",
        "Analgesics",
        "Antibiotics",
        "Antiseptics and Disinfectants",
        "Soaps and Detergents"
      ]
    },
    Mathematics: {
      "Sets, Relations & Functions": [
        "Sets and Operations on Sets",
        "Relations",
        "Functions",
        "Types of Functions",
        "Composition of Functions",
        "Inverse Functions"
      ],

      "Complex Numbers & Quadratic Equations": [
        "Complex Numbers",
        "Argand Plane",
        "Modulus and Argument",
        "Algebra of Complex Numbers",
        "Quadratic Equations",
        "Roots and Their Properties"
      ],

      "Matrices & Determinants": [
        "Types of Matrices",
        "Matrix Operations",
        "Determinants",
        "Properties of Determinants",
        "Inverse of a Matrix",
        "Systems of Linear Equations"
      ],

      "Permutations & Combinations": [
        "Fundamental Principle of Counting",
        "Permutations",
        "Combinations",
        "Circular Permutations",
        "Distribution of Objects"
      ],

      "Binomial Theorem": [
        "Binomial Expansion",
        "General Term",
        "Middle Term",
        "Binomial Coefficients",
        "Properties of Binomial Coefficients"
      ],

      "Sequences & Series": [
        "Sequences",
        "Arithmetic Progression",
        "Geometric Progression",
        "Arithmetic-Geometric Progression",
        "Special Series",
        "Sum of Series"
      ],

      "Limits, Continuity & Differentiability": [
        "Limits",
        "Standard Limits",
        "Continuity",
        "Differentiability",
        "Derivatives",
        "Differentiability and Continuity"
      ],

      "Integral Calculus": [
        "Indefinite Integration",
        "Methods of Integration",
        "Definite Integration",
        "Properties of Definite Integrals",
        "Area Under Curves"
      ],

      "Differential Equations": [
        "Formation of Differential Equations",
        "Order and Degree",
        "Variable Separable Equations",
        "First Order Linear Differential Equations"
      ],

      "Coordinate Geometry": [
        "Straight Lines",
        "Pair of Straight Lines",
        "Circles",
        "Parabola",
        "Ellipse",
        "Hyperbola"
      ],

      "Three Dimensional Geometry": [
        "Coordinates in 3D",
        "Direction Cosines and Ratios",
        "Equation of a Line",
        "Equation of a Plane",
        "Angles Between Lines and Planes",
        "Distances in 3D"
      ],

      "Vector Algebra": [
        "Vectors and Their Representation",
        "Vector Operations",
        "Dot Product",
        "Cross Product",
        "Scalar Triple Product",
        "Vector Applications"
      ],

      "Statistics & Probability": [
        "Measures of Dispersion",
        "Mean and Variance",
        "Probability Basics",
        "Conditional Probability",
        "Bayes' Theorem",
        "Random Variables"
      ],

      "Trigonometry": [
        "Trigonometric Ratios",
        "Trigonometric Identities",
        "Trigonometric Equations",
        "Inverse Trigonometric Functions",
        "Properties of Triangles"
      ]
    }
  },
  NEET: {
    Physics: {
      "Units & Measurements": [
        "Units and Dimensions",
        "Significant Figures",
        "Errors in Measurement",
        "Dimensional Analysis"
      ],

      "Kinematics": [
        "Motion in a Straight Line",
        "Motion in a Plane",
        "Projectile Motion",
        "Uniform Circular Motion"
      ],

      "Laws of Motion": [
        "Newton's Laws of Motion",
        "Momentum and Impulse",
        "Friction",
        "Circular Motion"
      ],

      "Work, Energy & Power": [
        "Work and Kinetic Energy",
        "Potential Energy",
        "Work-Energy Theorem",
        "Conservation of Energy",
        "Power"
      ],

      "Rotational Motion": [
        "Centre of Mass",
        "Torque and Angular Momentum",
        "Moment of Inertia",
        "Rotational Dynamics",
        "Rolling Motion"
      ],

      "Gravitation": [
        "Universal Law of Gravitation",
        "Gravitational Field and Potential",
        "Satellites",
        "Escape Velocity",
        "Kepler's Laws"
      ],

      "Properties of Matter": [
        "Elasticity",
        "Fluid Pressure and Viscosity",
        "Surface Tension",
        "Fluid Dynamics",
        "Thermal Properties of Matter"
      ],

      "Thermodynamics": [
        "Thermal Equilibrium and Temperature",
        "First Law of Thermodynamics",
        "Thermodynamic Processes",
        "Second Law of Thermodynamics",
        "Heat Engines and Refrigerators"
      ],

      "Kinetic Theory of Gases": [
        "Kinetic Theory of Gases",
        "Pressure and Temperature of a Gas",
        "RMS Speed",
        "Degrees of Freedom",
        "Law of Equipartition of Energy"
      ],

      "Oscillations & Waves": [
        "Simple Harmonic Motion",
        "Energy in SHM",
        "Simple Pendulum",
        "Wave Motion",
        "Superposition and Standing Waves",
        "Sound Waves and Doppler Effect"
      ],

      "Electrostatics": [
        "Electric Charges and Coulomb's Law",
        "Electric Field and Electric Dipole",
        "Electric Flux and Gauss's Law",
        "Electric Potential",
        "Capacitance and Capacitors"
      ],

      "Current Electricity": [
        "Electric Current and Drift Velocity",
        "Ohm's Law and Resistance",
        "Combination of Resistors",
        "Kirchhoff's Laws",
        "Wheatstone Bridge and Metre Bridge",
        "Cells and Internal Resistance"
      ],

      "Magnetic Effects of Current & Magnetism": [
        "Magnetic Field and Biot-Savart Law",
        "Ampere's Law",
        "Force on Moving Charges and Current-Carrying Conductors",
        "Torque on Current Loop",
        "Moving Coil Galvanometer",
        "Magnetic Properties of Matter"
      ],

      "Electromagnetic Induction & AC": [
        "Electromagnetic Induction",
        "Faraday's and Lenz's Laws",
        "Self and Mutual Inductance",
        "Alternating Current",
        "LCR Circuits and Resonance",
        "AC Generator and Transformer"
      ],

      "Electromagnetic Waves": [
        "Displacement Current",
        "Electromagnetic Waves",
        "Properties of Electromagnetic Waves",
        "Electromagnetic Spectrum"
      ],

      "Optics": [
        "Ray Optics",
        "Optical Instruments",
        "Wave Optics",
        "Interference",
        "Diffraction",
        "Polarisation"
      ],

      "Dual Nature of Matter & Radiation": [
        "Photoelectric Effect",
        "Einstein's Photoelectric Equation",
        "Matter Waves",
        "de Broglie Wavelength"
      ],

      "Atoms & Nuclei": [
        "Atomic Models",
        "Bohr's Model",
        "Hydrogen Spectrum",
        "Nuclear Physics",
        "Radioactivity",
        "Nuclear Fission and Fusion"
      ],

      "Electronic Devices": [
        "Semiconductors",
        "p-n Junction Diode",
        "Rectifiers",
        "Zener Diode",
        "LED, Photodiode and Solar Cell",
        "Logic Gates"
      ]
    },
    Chemistry: {
      "Some Basic Concepts of Chemistry": [
        "Mole Concept",
        "Atomic and Molecular Masses",
        "Stoichiometry",
        "Percentage Composition",
        "Empirical and Molecular Formula"
      ],

      "Structure of Atom": [
        "Nature of Electromagnetic Radiation",
        "Bohr's Atomic Model",
        "Quantum Numbers",
        "Electronic Configuration",
        "Atomic Orbitals"
      ],

      "Classification of Elements & Periodicity": [
        "Periodic Table",
        "Periodic Law",
        "Atomic Radius",
        "Ionization Enthalpy",
        "Electron Gain Enthalpy",
        "Valency and Chemical Properties"
      ],

      "Chemical Bonding & Molecular Structure": [
        "Ionic Bonding",
        "Covalent Bonding",
        "Lewis Structures",
        "VSEPR Theory",
        "Hybridization",
        "Molecular Orbital Theory"
      ],

      "States of Matter": [
        "Gaseous State",
        "Gas Laws",
        "Kinetic Theory of Gases",
        "Ideal and Real Gases",
        "Liquid State"
      ],

      "Thermodynamics": [
        "System and Surroundings",
        "First Law of Thermodynamics",
        "Enthalpy",
        "Hess's Law",
        "Entropy",
        "Gibbs Free Energy"
      ],

      "Equilibrium": [
        "Chemical Equilibrium",
        "Equilibrium Constant",
        "Le Chatelier's Principle",
        "Ionic Equilibrium",
        "Acids and Bases",
        "Solubility Equilibrium"
      ],

      "Redox Reactions": [
        "Oxidation and Reduction",
        "Oxidation Number",
        "Balancing Redox Reactions",
        "Redox Reactions in Daily Life"
      ],

      "Solutions": [
        "Types of Solutions",
        "Concentration Terms",
        "Solubility",
        "Raoult's Law",
        "Colligative Properties",
        "Abnormal Molar Mass"
      ],

      "Electrochemistry": [
        "Electrochemical Cells",
        "Electrode Potential",
        "Nernst Equation",
        "Electrolysis",
        "Conductance of Electrolytic Solutions",
        "Batteries and Fuel Cells"
      ],

      "Chemical Kinetics": [
        "Rate of Reaction",
        "Factors Affecting Reaction Rate",
        "Rate Law",
        "Order and Molecularity",
        "Integrated Rate Equations",
        "Arrhenius Equation"
      ],

      "Surface Chemistry": [
        "Adsorption",
        "Types of Adsorption",
        "Catalysis",
        "Colloids",
        "Emulsions"
      ],

      "p-Block Elements": [
        "Group 13 Elements",
        "Group 14 Elements",
        "Group 15 Elements",
        "Group 16 Elements",
        "Group 17 Elements",
        "Group 18 Elements"
      ],

      "d- and f-Block Elements": [
        "Transition Elements",
        "Electronic Configuration",
        "Oxidation States",
        "Magnetic Properties",
        "Coordination Behaviour",
        "Lanthanides and Actinides"
      ],

      "Coordination Compounds": [
        "Coordination Entities",
        "Ligands and Coordination Number",
        "Nomenclature",
        "Isomerism",
        "Bonding in Coordination Compounds",
        "Applications of Coordination Compounds"
      ],

      "Organic Chemistry – Basic Principles": [
        "Structure and Bonding",
        "Organic Nomenclature",
        "Isomerism",
        "Electronic Effects",
        "Reaction Intermediates",
        "Types of Organic Reactions"
      ],

      "Hydrocarbons": [
        "Alkanes",
        "Alkenes",
        "Alkynes",
        "Aromatic Hydrocarbons",
        "Conformations",
        "Important Reactions"
      ],

      "Organic Compounds Containing Halogens": [
        "Haloalkanes",
        "Haloarenes",
        "Preparation of Halo Compounds",
        "Nucleophilic Substitution",
        "Elimination Reactions"
      ],

      "Organic Compounds Containing Oxygen": [
        "Alcohols",
        "Phenols",
        "Ethers",
        "Aldehydes",
        "Ketones",
        "Carboxylic Acids"
      ],

      "Organic Compounds Containing Nitrogen": [
        "Amines",
        "Basicity of Amines",
        "Preparation of Amines",
        "Diazonium Salts",
        "Chemical Reactions of Amines"
      ],

      "Biomolecules": [
        "Carbohydrates",
        "Proteins",
        "Amino Acids",
        "Enzymes",
        "Nucleic Acids",
        "Vitamins"
      ],

      "Polymers": [
        "Classification of Polymers",
        "Addition Polymers",
        "Condensation Polymers",
        "Important Synthetic Polymers",
        "Biodegradable Polymers"
      ],

      "Chemistry in Everyday Life": [
        "Drugs and Medicines",
        "Analgesics",
        "Antibiotics",
        "Antiseptics and Disinfectants",
        "Soaps and Detergents"
      ]
    },
    Biology: {
      "The Living World": [
        "Characteristics of Living Organisms",
        "Taxonomic Categories",
        "Taxonomical Aids",
        "Binomial Nomenclature"
      ],

      "Biological Classification": [
        "Five Kingdom Classification",
        "Kingdom Monera",
        "Kingdom Protista",
        "Kingdom Fungi",
        "Viruses, Viroids and Lichens"
      ],

      "Plant Kingdom": [
        "Algae",
        "Bryophytes",
        "Pteridophytes",
        "Gymnosperms",
        "Angiosperms",
        "Plant Life Cycles"
      ],

      "Animal Kingdom": [
        "Basis of Animal Classification",
        "Non-Chordates",
        "Chordates",
        "Animal Phyla",
        "Vertebrate Classification"
      ],

      "Morphology of Flowering Plants": [
        "Root",
        "Stem",
        "Leaf",
        "Inflorescence",
        "Flower",
        "Fruit and Seed"
      ],

      "Anatomy of Flowering Plants": [
        "Plant Tissues",
        "Meristematic and Permanent Tissues",
        "Anatomy of Root",
        "Anatomy of Stem",
        "Anatomy of Leaf",
        "Secondary Growth"
      ],

      "Structural Organisation in Animals": [
        "Animal Tissues",
        "Epithelial Tissue",
        "Connective Tissue",
        "Muscular Tissue",
        "Nervous Tissue",
        "Cockroach Structure and Organisation"
      ],

      "Cell: The Unit of Life": [
        "Cell Structure",
        "Cell Membrane",
        "Cell Organelles",
        "Nucleus",
        "Prokaryotic and Eukaryotic Cells",
        "Cell Junctions"
      ],

      "Biomolecules": [
        "Carbohydrates",
        "Proteins",
        "Lipids",
        "Nucleic Acids",
        "Enzymes",
        "Metabolism"
      ],

      "Cell Cycle & Cell Division": [
        "Cell Cycle",
        "Mitosis",
        "Meiosis",
        "Significance of Cell Division"
      ],

      "Transport in Plants": [
        "Water Movement",
        "Mineral Transport",
        "Xylem Transport",
        "Phloem Transport",
        "Transpiration",
        "Translocation"
      ],

      "Mineral Nutrition": [
        "Essential Mineral Elements",
        "Macronutrients and Micronutrients",
        "Deficiency Symptoms",
        "Nitrogen Metabolism",
        "Biological Nitrogen Fixation"
      ],

      "Photosynthesis in Plants": [
        "Photosynthetic Pigments",
        "Light Reaction",
        "Photophosphorylation",
        "Calvin Cycle",
        "C4 Pathway",
        "Photorespiration"
      ],

      "Respiration in Plants": [
        "Glycolysis",
        "Fermentation",
        "Krebs Cycle",
        "Electron Transport System",
        "Oxidative Phosphorylation",
        "Respiratory Quotient"
      ],

      "Plant Growth & Development": [
        "Growth Phases",
        "Plant Growth Regulators",
        "Auxins and Gibberellins",
        "Cytokinins and Ethylene",
        "Abscisic Acid",
        "Photoperiodism and Vernalisation"
      ],

      "Digestion & Absorption": [
        "Human Digestive System",
        "Digestive Enzymes",
        "Digestion of Food",
        "Absorption",
        "Assimilation",
        "Digestive Disorders"
      ],

      "Breathing & Exchange of Gases": [
        "Human Respiratory System",
        "Mechanism of Breathing",
        "Exchange of Gases",
        "Transport of Oxygen and Carbon Dioxide",
        "Respiratory Volumes",
        "Respiratory Disorders"
      ],

      "Body Fluids & Circulation": [
        "Blood",
        "Blood Groups",
        "Blood Clotting",
        "Human Heart",
        "Cardiac Cycle",
        "Double Circulation"
      ],

      "Excretory Products & Elimination": [
        "Human Excretory System",
        "Urine Formation",
        "Glomerular Filtration",
        "Tubular Reabsorption",
        "Counter-Current Mechanism",
        "Osmoregulation"
      ],

      "Locomotion & Movement": [
        "Types of Movement",
        "Skeletal System",
        "Muscle Structure",
        "Muscle Contraction",
        "Skeletal Disorders"
      ],

      "Neural Control & Coordination": [
        "Nervous System",
        "Neuron and Nerve Impulse",
        "Central Nervous System",
        "Peripheral Nervous System",
        "Reflex Action",
        "Sensory Reception"
      ],

      "Chemical Coordination & Integration": [
        "Endocrine Glands",
        "Hormones",
        "Pituitary and Thyroid",
        "Parathyroid and Adrenal Glands",
        "Pancreas and Gonads",
        "Hormonal Disorders"
      ],

      "Sexual Reproduction in Flowering Plants": [
        "Flower Structure",
        "Male Reproductive Structure",
        "Female Reproductive Structure",
        "Pollination",
        "Fertilisation",
        "Seed and Fruit Formation"
      ],

      "Human Reproduction": [
        "Male Reproductive System",
        "Female Reproductive System",
        "Gametogenesis",
        "Menstrual Cycle",
        "Fertilisation and Implantation",
        "Pregnancy and Parturition"
      ],

      "Reproductive Health": [
        "Reproductive Health",
        "Contraceptive Methods",
        "Infertility",
        "Assisted Reproductive Technologies",
        "Sexually Transmitted Infections"
      ],

      "Principles of Inheritance & Variation": [
        "Mendelian Genetics",
        "Monohybrid and Dihybrid Crosses",
        "Chromosomal Theory of Inheritance",
        "Linkage and Recombination",
        "Sex Determination",
        "Genetic Disorders"
      ],

      "Molecular Basis of Inheritance": [
        "DNA Structure",
        "DNA Replication",
        "Transcription",
        "Translation",
        "Genetic Code",
        "Gene Regulation"
      ],

      "Evolution": [
        "Origin of Life",
        "Evidence of Evolution",
        "Darwin's Theory",
        "Natural Selection",
        "Hardy-Weinberg Principle",
        "Human Evolution"
      ],

      "Human Health & Disease": [
        "Health and Disease",
        "Common Diseases",
        "Immune System",
        "Vaccination and Immunisation",
        "Cancer",
        "AIDS and Other Infections"
      ],

      "Microbes in Human Welfare": [
        "Microbes in Household Products",
        "Industrial Production",
        "Antibiotics",
        "Sewage Treatment",
        "Biogas Production",
        "Biofertilisers"
      ],

      "Biotechnology: Principles & Processes": [
        "Recombinant DNA Technology",
        "Restriction Enzymes",
        "Cloning Vectors",
        "PCR",
        "Gel Electrophoresis",
        "Bioreactors"
      ],

      "Biotechnology & Its Applications": [
        "Genetically Modified Organisms",
        "Insulin Production",
        "Gene Therapy",
        "Molecular Diagnosis",
        "Transgenic Animals",
        "Biosafety and Ethical Issues"
      ],

      "Organisms & Populations": [
        "Organism and Environment",
        "Population Attributes",
        "Population Growth",
        "Population Interactions",
        "Adaptations"
      ],

      "Ecosystem": [
        "Ecosystem Structure",
        "Energy Flow",
        "Food Chains and Food Webs",
        "Ecological Pyramids",
        "Nutrient Cycles",
        "Ecological Succession"
      ],

      "Biodiversity & Conservation": [
        "Biodiversity",
        "Levels of Biodiversity",
        "Biodiversity Patterns",
        "Loss of Biodiversity",
        "Conservation Strategies",
        "Protected Areas"
      ],

      "Environmental Issues": [
        "Air Pollution",
        "Water Pollution",
        "Solid Waste Management",
        "Ozone Depletion",
        "Global Warming",
        "Environmental Conservation"
      ]
    }
  },
};

const LEARNING_STYLES = [
  {
    value: "visual",
    label: "Show me",
    description: "I learn best with diagrams, charts & visual explanations.",
  },
  {
    value: "reading",
    label: "Let me read",
    description: "I prefer notes, textbooks & detailed explanations.",
  },
  {
    value: "practice",
    label: "Let me practice",
    description: "I understand better by solving questions and learning from mistakes.",
  },
  {
    value: "concept_first",
    label: "Make it make sense",
    description: "I like to understand the concept deeply before I start practicing.",
  },
];

export default function OnboardingSurvey() {
  const { currentUser, getToken, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    target_exam: "",
    class_level: "",
    previous_coaching: "",
    difficult_subjects: [],
    learning_style: "",
    academic_goals: "",
    hours_per_day: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [expandedChapter, setExpandedChapter] = useState(null);
  useEffect(() => {
    async function loadExistingSurvey() {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await axios.get(`${BACKEND_URL}/api/auth/onboarding-survey`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.survey) {
          const s = res.data.survey;
          setForm({
            target_exam: s.target_exam || "",
            class_level: s.class_level || "",
            previous_coaching: s.previous_coaching || "",
            difficult_subjects: s.difficult_subjects || [],
            learning_style: s.learning_style || "",
            academic_goals: s.academic_goals || "",
            hours_per_day: s.hours_per_day || "",
          });
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error("Failed to load existing survey:", err);
        }
      }
    }
    loadExistingSurvey();
  }, [getToken]);

  function toggleSubject(subj) {
    setForm((f) => ({
      ...f,
      difficult_subjects: f.difficult_subjects.includes(subj)
        ? f.difficult_subjects.filter((s) => s !== subj)
        : [...f.difficult_subjects, subj],
    }));
  }
  function clearSubjectTopics(subject) {
    const subjectChapters =
      SYLLABUS[form.target_exam || "JEE"][subject];

    const subjectTopics = Object.values(subjectChapters).flat();

    setForm((f) => ({
      ...f,
      difficult_subjects: f.difficult_subjects.filter(
        (topic) => !subjectTopics.includes(topic)
      ),
    }));
  }

  async function handleSubmit() {
    if (!form.target_exam) return setError("Please select your target exam.");
    if (!form.academic_goals.trim()) return setError("Please share your academic goals.");

    try {
      setLoading(true);
      setError("");
      const token = await getToken();

      // Save survey to Firestore via backend
      await axios.post(
        `${BACKEND_URL}/api/auth/onboarding-survey`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (refreshProfile) {
        await refreshProfile();
      }

      navigate("/batch-selection");
    } catch (err) {
      console.error(err);
      setError("Failed to save your survey. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-brand-bg-dark text-white relative overflow-hidden">
      <div className="glowing-bg top-[-80px] left-[-80px]" />
      <div className="glowing-bg bottom-[-80px] right-[-80px]" style={{ animationDelay: "-5s" }} />

      {/* Header */}
      <div className="p-6 flex items-center gap-2 z-10 relative max-w-3xl mx-auto">
        <GraduationCap className="w-6 h-6 text-brand-accent" />
        <span className="text-lg font-bold">Aspira</span>
      </div>

      {/* Progress */}
      <div className="max-w-3xl mx-auto px-6 mb-8 z-10 relative">
        <div className="flex items-center gap-2 mb-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <React.Fragment key={i}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${i + 1 < step ? "bg-brand-accent border-brand-accent text-white" :
                i + 1 === step ? "border-brand-accent text-brand-accent" :
                  "border-gray-700 text-gray-600"
                }`}>
                {i + 1 < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              {i < totalSteps - 1 && (
                <div className={`flex-1 h-0.5 rounded-full transition-all ${i + 1 < step ? "bg-brand-accent" : "bg-gray-700"}`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-xs text-gray-400">Step {step} of {totalSteps} — Tell us about yourself</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 z-10 relative pb-16">
        {userProfile?.status === "incomplete_profile_rejected" && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-rose-400">Enrollment Rejected: Incomplete Profile</h3>
              <p className="text-xs text-rose-300 mt-1">
                Your previous enrollment request was rejected because your profile was missing necessary information. Please carefully review and complete all sections below so your teacher can better understand your needs.
              </p>
            </div>
          </div>
        )}

        <div className="glass-card rounded-2xl border border-brand-border-dark p-8 shadow-2xl">

          {error && (
            <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-400 text-sm p-4 rounded-xl mb-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── STEP 1: Exam & Background ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-5 h-5 text-brand-accent" />
                  <h2 className="text-2xl font-extrabold">Your Target Exam</h2>
                </div>
                <p className="text-gray-400 text-sm mb-6">Tell us what you're preparing for, and let Aspira personalize the rest.</p>

                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">What's your target exam?</label>
                <div className="grid grid-cols-2 gap-4">
                  {["JEE", "NEET"].map((exam) => (
                    <button
                      key={exam}
                      onClick={() => setForm((f) => ({ ...f, target_exam: exam }))}
                      className={`p-5 rounded-xl border-2 transition-all text-left cursor-pointer ${form.target_exam === exam
                        ? "border-brand-accent bg-brand-accent/10"
                        : "border-gray-700 hover:border-gray-500 bg-gray-800/30"
                        }`}
                    >
                      <div className="text-lg font-extrabold mb-1">{exam}</div>
                      <div className="text-xs text-gray-400">
                        {exam === "JEE" ? "Physics · Chemistry · Mathematics" : "Physics · Chemistry · Biology"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Where are you right now?</label>
                <div className="grid grid-cols-3 gap-3">
                  {["Class 11", "Class 12", "Dropper"].map((cls) => (
                    <button
                      key={cls}
                      onClick={() => setForm((f) => ({ ...f, class_level: cls }))}
                      className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer ${form.class_level === cls
                        ? "border-brand-accent bg-brand-accent/10 text-white"
                        : "border-gray-700 hover:border-gray-500 text-gray-400"
                        }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">How have you been preparing so far?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ v: "yes", l: "Yes, I've had coaching" }, { v: "no", l: "No, I self-study" }].map(({ v, l }) => (
                    <button
                      key={v}
                      onClick={() => setForm((f) => ({ ...f, previous_coaching: v }))}
                      className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer ${form.previous_coaching === v
                        ? "border-brand-accent bg-brand-accent/10 text-white"
                        : "border-gray-700 hover:border-gray-500 text-gray-400"
                        }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Subjects & Learning Style ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-5 h-5 text-brand-accent" />
                  <h2 className="text-2xl font-extrabold">Strengths & Weaknesses</h2>
                </div>
                <p className="text-gray-400 text-sm mb-6">Tell us where you need the most help. We'll use this to personalize your first test.</p>

                <label className="block text-sm font-bold text-white mb-1">
                  What would you like more help with?
                </label>

                <p className="text-gray-400 text-sm mb-4">
                  Select the topics you find challenging.
                </p>
                <div className="space-y-3">
                  {Object.entries(SYLLABUS[form.target_exam || "JEE"]).map(
                    ([subject, chapters]) => {
                      const selectedCount = Object.values(chapters)
                        .flat()
                        .filter((topic) => form.difficult_subjects.includes(topic))
                        .length;

                      const isSubjectOpen = expandedSubject === subject;

                      return (
                        <div
                          key={subject}
                          className="border-2 border-gray-700 rounded-xl overflow-hidden"
                        >
                          {/* SUBJECT */}
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedSubject(isSubjectOpen ? null : subject);
                              setExpandedChapter(null);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-all cursor-pointer ${selectedCount > 0
                              ? "bg-brand-accent/10 text-brand-accent"
                              : "bg-gray-800/30 text-white"
                              }`}
                          >
                            <span>
                              {selectedCount > 0
                                ? `${selectedCount} topics selected in ${subject}`
                                : subject}
                            </span>

                            <ChevronRight
                              className={`w-4 h-4 transition-transform ${isSubjectOpen ? "rotate-90" : ""
                                }`}
                            />
                          </button>

                          {/* CHAPTERS */}
                          {isSubjectOpen && (
                            <div className="p-3 space-y-2 bg-gray-900/40">
                              {Object.entries(chapters).map(([chapter, topics]) => {
                                const selectedChapterCount = topics.filter((topic) =>
                                  form.difficult_subjects.includes(topic)
                                ).length;

                                const chapterKey = `${subject}-${chapter}`;
                                const isChapterOpen = expandedChapter === chapterKey;

                                return (
                                  <div
                                    key={chapter}
                                    className="border border-gray-700 rounded-lg overflow-hidden"
                                  >
                                    {/* CHAPTER */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedChapter(
                                          isChapterOpen ? null : chapterKey
                                        )
                                      }
                                      className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${selectedChapterCount > 0
                                        ? "bg-brand-accent/5 text-brand-accent"
                                        : "bg-gray-800/20 text-gray-200"
                                        }`}
                                    >
                                      <span>
                                        {selectedChapterCount > 0
                                          ? `${selectedChapterCount} topics selected in ${chapter}`
                                          : chapter}
                                      </span>

                                      <ChevronRight
                                        className={`w-4 h-4 transition-transform ${isChapterOpen ? "rotate-90" : ""
                                          }`}
                                      />
                                    </button>

                                    {/* SUBTOPICS */}
                                    {isChapterOpen && (
                                      <div className="p-4 flex flex-wrap gap-2 bg-gray-950/30">
                                        {topics.map((topic) => {
                                          const isSelected =
                                            form.difficult_subjects.includes(topic);

                                          return (
                                            <button
                                              key={topic}
                                              type="button"
                                              onClick={() => toggleSubject(topic)}
                                              className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all cursor-pointer ${isSelected
                                                ? "border-brand-accent bg-brand-accent/15 text-brand-accent"
                                                : "border-gray-700 text-gray-400 hover:border-gray-500"
                                                }`}
                                            >
                                              {isSelected && "✓ "}
                                              {topic}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {/* CLEAR THIS SUBJECT ONLY */}
                              {selectedCount > 0 && (
                                <div className="flex justify-end pt-2">
                                  <button
                                    type="button"
                                    onClick={() => clearSubjectTopics(subject)}
                                    className="px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 text-xs font-semibold transition-all"
                                  >
                                    Clear {subject} selections ({selectedCount})
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>

              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  How do you learn best?
                </label>

                <p className="text-gray-400 text-sm mb-3">
                  Pick the approach that feels most natural to you.
                </p>                <div className="space-y-2">
                  {LEARNING_STYLES.map(({ value, label, description }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          learning_style: value,
                        }))
                      }
                      className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all cursor-pointer ${form.learning_style === value
                        ? "border-brand-accent bg-brand-accent/10"
                        : "border-gray-700 hover:border-gray-500 bg-gray-800/20"
                        }`}
                    >
                      <div
                        className={`text-sm font-bold ${form.learning_style === value
                          ? "text-brand-accent"
                          : "text-white"
                          }`}
                      >
                        {label}
                      </div>

                      <div className="text-xs text-gray-400 mt-1">
                        {description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Goals ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="w-5 h-5 text-brand-accent" />
                  <h2 className="text-2xl font-extrabold">Your Goals</h2>
                </div>
                <p className="text-gray-400 text-sm mb-6">Tell us what success means to you, and let Aspira build around it.</p>

                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Academic goals & aspirations</label>
                <textarea
                  rows={4}
                  placeholder="e.g., I want to crack JEE Advanced and get into IIT Bombay CSE. I'm particularly weak in Calculus and want to reach at least 80% accuracy before the exam..."
                  value={form.academic_goals}
                  onChange={(e) => setForm((f) => ({ ...f, academic_goals: e.target.value }))}
                  className="w-full bg-gray-800/50 border border-brand-border-dark rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">How much time can you realistically study each day?</label>
                <div className="grid grid-cols-4 gap-3">
                  {["1-2", "3-4", "5-6", "7+"].map((h) => (
                    <button
                      key={h}
                      onClick={() => setForm((f) => ({ ...f, hours_per_day: h }))}
                      className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer ${form.hours_per_day === h
                        ? "border-brand-accent bg-brand-accent/10 text-white"
                        : "border-gray-700 hover:border-gray-500 text-gray-400"
                        }`}
                    >
                      {h} hrs
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3 bg-brand-accent/5 border border-brand-accent/15 rounded-xl p-4">
                <Lightbulb className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300">
Once you complete your first diagnostic test, Aspira will use your responses and performance to build a personalized study plan for you.                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 font-semibold text-sm transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : <div />}

            {step < totalSteps ? (
              <button
                onClick={() => {
                  if (step === 1) {
                    if (!form.target_exam) return setError("Please select your target exam.");
                    if (!form.class_level) return setError("Please select your current class.");
                    if (!form.previous_coaching) return setError("Please select your coaching experience.");
                  }
                  if (step === 2) {
                    if (!form.learning_style) return setError("Please select your preferred learning style.");
                  }
                  setError("");
                  setStep((s) => s + 1);
                }}
                className="flex items-center gap-2 px-8 py-3 bg-brand-accent hover:bg-brand-accent-hover rounded-xl font-bold text-sm text-white transition-all"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-brand-accent hover:bg-brand-accent-hover disabled:bg-brand-accent/50 rounded-xl font-bold text-sm text-white transition-all"
              >
                {loading ? "Saving…" : "Continue to Batches"} {!loading && <ChevronRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
