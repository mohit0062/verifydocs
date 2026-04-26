// ===== VERHOEFF ALGORITHM (Aadhaar) =====
const V_D = [
  [0,1,2,3,4,5,6,7,8,9],
  [1,2,3,4,0,6,7,8,9,5],
  [2,3,4,0,1,7,8,9,5,6],
  [3,4,0,1,2,8,9,5,6,7],
  [4,0,1,2,3,9,5,6,7,8],
  [5,9,8,7,6,0,4,3,2,1],
  [6,5,9,8,7,1,0,4,3,2],
  [7,6,5,9,8,2,1,0,4,3],
  [8,7,6,5,9,3,2,1,0,4],
  [9,8,7,6,5,4,3,2,1,0]
];
const V_P = [
  [0,1,2,3,4,5,6,7,8,9],
  [1,5,7,6,2,8,3,0,9,4],
  [5,8,0,3,7,9,6,1,4,2],
  [8,9,1,6,0,4,3,5,2,7],
  [9,4,5,3,1,2,6,8,7,0],
  [4,2,8,6,5,7,3,9,0,1],
  [2,7,9,3,8,0,6,4,1,5],
  [7,0,4,6,9,1,3,2,5,8]
];

function validateAadhaar(num) {
  num = num.replace(/\D/g, '');
  if (num.length !== 12) return { valid: false, reason: 'Must be exactly 12 digits' };
  if (/^[0-1]/.test(num)) return { valid: false, reason: 'Aadhaar cannot start with 0 or 1' };
  let c = 0;
  const digits = num.split('').reverse().map(Number);
  for (let i = 0; i < digits.length; i++) {
    c = V_D[c][V_P[i % 8][digits[i]]];
  }
  if (c !== 0) return { valid: false, reason: 'Invalid checksum (Verhoeff algorithm failed)' };
  return { valid: true, formatted: num.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3') };
}

// ===== PAN VALIDATOR =====
const PAN_ENTITY = {
  'P': 'Individual', 'C': 'Company', 'H': 'Hindu Undivided Family (HUF)',
  'F': 'Firm / Partnership', 'A': 'Association of Persons (AOP)',
  'T': 'Trust', 'B': 'Body of Individuals (BOI)',
  'L': 'Local Authority', 'J': 'Artificial Juridical Person', 'G': 'Government'
};

function validatePAN(pan) {
  pan = pan.toUpperCase().trim();
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
    if (pan.length !== 10) return { valid: false, reason: `Length must be 10 characters (got ${pan.length})` };
    return { valid: false, reason: 'Format must be: 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F)' };
  }
  const entityChar = pan[3];
  const entityType = PAN_ENTITY[entityChar];
  if (!entityType) return { valid: false, reason: `Invalid entity type character '${entityChar}' at position 4` };
  return {
    valid: true,
    formatted: pan,
    jurisdictionCode: pan.substring(0, 3),
    entityChar,
    entityType,
    holderInitial: pan[4],
    sequenceNumber: pan.substring(5, 9),
    checkDigit: pan[9]
  };
}

// ===== GST VALIDATOR =====
const STATE_CODES = {
  '01':'Jammu and Kashmir','02':'Himachal Pradesh','03':'Punjab',
  '04':'Chandigarh','05':'Uttarakhand','06':'Haryana',
  '07':'Delhi','08':'Rajasthan','09':'Uttar Pradesh',
  '10':'Bihar','11':'Sikkim','12':'Arunachal Pradesh',
  '13':'Nagaland','14':'Manipur','15':'Mizoram',
  '16':'Tripura','17':'Meghalaya','18':'Assam',
  '19':'West Bengal','20':'Jharkhand','21':'Odisha',
  '22':'Chhattisgarh','23':'Madhya Pradesh','24':'Gujarat',
  '26':'Dadra and Nagar Haveli and Daman and Diu','27':'Maharashtra',
  '28':'Andhra Pradesh (Old)','29':'Karnataka','30':'Goa',
  '31':'Lakshadweep','32':'Kerala','33':'Tamil Nadu',
  '34':'Puducherry','35':'Andaman and Nicobar Islands',
  '36':'Telangana','37':'Andhra Pradesh','38':'Ladakh'
};

function validateGST(gst) {
  gst = gst.toUpperCase().trim();
  if (gst.length !== 15) return { valid: false, reason: `GST number must be 15 characters (got ${gst.length})` };
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst)) {
    return { valid: false, reason: 'Invalid GST format. Expected: 2 digits + 10-char PAN + entity# + Z + checksum' };
  }
  const stateCode = gst.substring(0, 2);
  const state = STATE_CODES[stateCode];
  if (!state) return { valid: false, reason: `Invalid state code '${stateCode}'` };
  return {
    valid: true,
    formatted: gst,
    stateCode, state,
    pan: gst.substring(2, 12),
    entityNumber: gst[12],
    checkDigit: gst[14]
  };
}

// ===== IFSC VALIDATOR =====
const BANK_CODES = {
  'HDFC':'HDFC Bank','ICIC':'ICICI Bank','SBIN':'State Bank of India',
  'PUNB':'Punjab National Bank','UBIN':'Union Bank of India',
  'BKID':'Bank of India','BARB':'Bank of Baroda','CNRB':'Canara Bank',
  'IOBA':'Indian Overseas Bank','ANDB':'Andhra Bank',
  'UTIB':'Axis Bank','KKBK':'Kotak Mahindra Bank','YESB':'Yes Bank',
  'INDB':'IndusInd Bank','FDRL':'Federal Bank','KARB':'Karnataka Bank',
  'KVBL':'Karur Vysya Bank','DCBL':'DCB Bank','RBLB':'RBL Bank',
  'CITI':'Citibank','HSBC':'HSBC Bank','DEUT':'Deutsche Bank',
  'SCBL':'Standard Chartered Bank','BNPA':'BNP Paribas',
  'ALLA':'Allahabad Bank','CORP':'Corporation Bank',
  'VIJB':'Vijaya Bank','DENA':'Dena Bank','ORBC':'Oriental Bank',
  'MAHB':'Bank of Maharashtra','PSIB':'Punjab & Sind Bank',
  'SIBL':'South Indian Bank','TMBL':'Tamilnad Mercantile Bank',
  'IDBI':'IDBI Bank','IDFC':'IDFC First Bank','AUBL':'AU Small Finance Bank'
};

function validateIFSC(ifsc) {
  ifsc = ifsc.toUpperCase().trim();
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
    if (ifsc.length !== 11) return { valid: false, reason: `IFSC must be 11 characters (got ${ifsc.length})` };
    if (ifsc[4] !== '0') return { valid: false, reason: '5th character must always be 0' };
    return { valid: false, reason: 'Format: 4 letters (bank) + 0 + 6 alphanumeric (branch)' };
  }
  const bankCode = ifsc.substring(0, 4);
  const bankName = BANK_CODES[bankCode] || null;
  return {
    valid: true,
    formatted: ifsc,
    bankCode,
    bankName: bankName || `Bank code: ${bankCode} (lesser-known bank)`,
    branchCode: ifsc.substring(5)
  };
}

// ===== VOTER ID (EPIC) VALIDATOR =====
function validateVoterID(id) {
  id = id.toUpperCase().trim();
  if (!/^[A-Z]{3}[0-9]{7}$/.test(id)) {
    if (id.length !== 10) return { valid: false, reason: `Voter ID must be 10 characters (got ${id.length})` };
    return { valid: false, reason: 'Format must be: 3 letters + 7 digits (e.g. ABC1234567)' };
  }
  return {
    valid: true,
    formatted: id,
    stateCode: id.substring(0, 3),
    serialNumber: id.substring(3)
  };
}

// ===== PASSPORT VALIDATOR =====
function validatePassport(num) {
  num = num.toUpperCase().trim();
  if (!/^[A-Z]{1}[0-9]{7}$/.test(num)) {
    if (num.length !== 8) return { valid: false, reason: `Passport number must be 8 characters (got ${num.length})` };
    return { valid: false, reason: 'Format: 1 letter + 7 digits (e.g. A1234567)' };
  }
  const typeMap = {
    'P':'Regular (Personal) Passport','D':'Diplomatic Passport',
    'S':'Official/Service Passport','J':'Emergency Certificate'
  };
  return {
    valid: true,
    formatted: num,
    typeChar: num[0],
    passportType: typeMap[num[0]] || 'Indian Passport',
    serialNumber: num.substring(1)
  };
}

// ===== DRIVING LICENSE VALIDATOR =====
function validateDL(dl) {
  dl = dl.toUpperCase().replace(/[-\s]/g, '');
  // Format: State(2) + District(2) + Year(4) + Serial(7)
  if (!/^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/.test(dl) && !/^[A-Z]{2}[0-9]{2}[0-9]{11}$/.test(dl)) {
    return { valid: false, reason: 'Format: State code (2) + RTO code (2) + year (4) + serial (7). E.g. MH0120201234567' };
  }
  const stateCodeDL = dl.substring(0, 2);
  const STATE_DL = {
    'AP':'Andhra Pradesh','AR':'Arunachal Pradesh','AS':'Assam','BR':'Bihar',
    'CG':'Chhattisgarh','GA':'Goa','GJ':'Gujarat','HR':'Haryana',
    'HP':'Himachal Pradesh','JK':'Jammu and Kashmir','JH':'Jharkhand',
    'KA':'Karnataka','KL':'Kerala','MP':'Madhya Pradesh','MH':'Maharashtra',
    'MN':'Manipur','ML':'Meghalaya','MZ':'Mizoram','NL':'Nagaland',
    'OD':'Odisha','PB':'Punjab','RJ':'Rajasthan','SK':'Sikkim',
    'TN':'Tamil Nadu','TG':'Telangana','TR':'Tripura','UP':'Uttar Pradesh',
    'UK':'Uttarakhand','WB':'West Bengal','AN':'Andaman and Nicobar',
    'CH':'Chandigarh','DD':'Dadra and Nagar Haveli','DL':'Delhi',
    'LD':'Lakshadweep','PY':'Puducherry','LA':'Ladakh'
  };
  return {
    valid: true,
    formatted: dl,
    stateCode: stateCodeDL,
    stateName: STATE_DL[stateCodeDL] || 'Unknown State',
    rtoCode: dl.substring(2, 4)
  };
}

// ===== UPI ID VALIDATOR =====
function validateUPI(upi) {
  upi = upi.trim().toLowerCase();
  if (!upi.includes('@')) return { valid: false, reason: "UPI ID must contain '@' (e.g. username@bank)" };
  const [handle, psp] = upi.split('@');
  if (!handle || !psp) return { valid: false, reason: 'Invalid handle or bank name' };
  if (!/^[a-zA-Z0-9.\-_]{2,}$/.test(handle)) return { valid: false, reason: 'Handle must be at least 2 characters (letters, numbers, dot, dash, underscore)' };
  if (!/^[a-zA-Z]{2,}$/.test(psp)) return { valid: false, reason: 'Bank/PSP code must be at least 2 letters' };
  return {
    valid: true,
    formatted: upi,
    handle,
    psp
  };
}

// ===== VEHICLE REGISTRATION VALIDATOR =====
function validateVehicle(plate) {
  plate = plate.toUpperCase().replace(/\s/g, '');
  // Format: State(2) + District(2) + Series(0-2) + Number(4)
  if (!/^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/.test(plate)) {
    return { valid: false, reason: 'Format: State code (2) + District (1-2) + Series (0-3) + 4 digits. E.g. DL01C1234' };
  }
  const stateCode = plate.substring(0, 2);
  const STATE_DL = { // Reuse state mapping from DL validator
    'AP':'Andhra Pradesh','AR':'Arunachal Pradesh','AS':'Assam','BR':'Bihar','CG':'Chhattisgarh','GA':'Goa','GJ':'Gujarat','HR':'Haryana','HP':'Himachal Pradesh','JK':'Jammu and Kashmir','JH':'Jharkhand','KA':'Karnataka','KL':'Kerala','MP':'Madhya Pradesh','MH':'Maharashtra','MN':'Manipur','ML':'Meghalaya','MZ':'Mizoram','NL':'Nagaland','OD':'Odisha','PB':'Punjab','RJ':'Rajasthan','SK':'Sikkim','TN':'Tamil Nadu','TG':'Telangana','TR':'Tripura','UP':'Uttar Pradesh','UK':'Uttarakhand','WB':'West Bengal','AN':'Andaman and Nicobar','CH':'Chandigarh','DD':'Dadra and Nagar Haveli','DL':'Delhi','LD':'Lakshadweep','PY':'Puducherry','LA':'Ladakh'
  };
  return {
    valid: true,
    formatted: plate.replace(/([A-Z]{2})(\d{1,2})([A-Z]{0,3})(\d{4})/, '$1 $2 $3 $4').replace(/\s+/g, ' '),
    stateName: STATE_DL[stateCode] || 'Unknown State',
    stateCode
  };
}

// ===== LIC POLICY VALIDATOR =====
function validateLIC(num) {
  num = num.replace(/\s/g, '');
  if (!/^\d{9}$/.test(num)) {
    return { valid: false, reason: 'LIC Policy number must be exactly 9 digits' };
  }
  return {
    valid: true,
    formatted: num.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')
  };
}

// ===== AUTO-DETECT DOCUMENT TYPE =====
function autoDetect(input) {
  const clean = input.replace(/\s/g, '').toUpperCase();
  if (/^\d{12}$/.test(clean)) return { type: 'aadhaar', label: 'Aadhaar Number', result: validateAadhaar(clean) };
  if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(clean)) return { type: 'pan', label: 'PAN Card', result: validatePAN(clean) };
  if (/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(clean)) return { type: 'gst', label: 'GST Number', result: validateGST(clean) };
  if (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(clean)) return { type: 'ifsc', label: 'IFSC Code', result: validateIFSC(clean) };
  if (/^[A-Z]{3}[0-9]{7}$/.test(clean)) return { type: 'voterid', label: 'Voter ID (EPIC)', result: validateVoterID(clean) };
  if (/^[A-Z][0-9]{7}$/.test(clean)) return { type: 'passport', label: 'Passport Number', result: validatePassport(clean) };
  if (/^[A-Z]{2}[0-9]{13}$/.test(clean)) return { type: 'dl', label: 'Driving License', result: validateDL(clean) };
  if (/^\d{9}$/.test(clean)) return { type: 'lic', label: 'LIC Policy', result: validateLIC(clean) };
  
  // Try UPI (case insensitive so we check raw input but logic handles it)
  if (input.includes('@')) {
    const upiRes = validateUPI(input);
    if (upiRes.valid) return { type: 'upi', label: 'UPI ID', result: upiRes };
  }
  
  // Try Vehicle (after others as it's more flexible)
  const vehRes = validateVehicle(clean);
  if (vehRes.valid) return { type: 'vehicle', label: 'Vehicle Number', result: vehRes };

  return null;
}

// ===== FAKE USAGE COUNTER (date-seeded) =====
function getUsageCount(toolName) {
  const base = { aadhaar: 1240, pan: 980, gst: 745, ifsc: 623, voterid: 412, passport: 334, dl: 289, mask: 567, upi: 812, vehicle: 543, lic: 312 };
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const seed = (dayOfYear * 31 + toolName.charCodeAt(0) * 7) % 200;
  return (base[toolName] || 500) + seed;
}
