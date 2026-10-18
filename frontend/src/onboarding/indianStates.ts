export interface IndianRegion {
  code: string
  name: string
  type: 'state' | 'ut'
}

export const INDIAN_STATES_AND_UTS: IndianRegion[] = [
  // 28 States
  { code: 'AP', name: 'Andhra Pradesh', type: 'state' },
  { code: 'AR', name: 'Arunachal Pradesh', type: 'state' },
  { code: 'AS', name: 'Assam', type: 'state' },
  { code: 'BR', name: 'Bihar', type: 'state' },
  { code: 'CG', name: 'Chhattisgarh', type: 'state' },
  { code: 'GA', name: 'Goa', type: 'state' },
  { code: 'GJ', name: 'Gujarat', type: 'state' },
  { code: 'HR', name: 'Haryana', type: 'state' },
  { code: 'HP', name: 'Himachal Pradesh', type: 'state' },
  { code: 'JH', name: 'Jharkhand', type: 'state' },
  { code: 'KA', name: 'Karnataka', type: 'state' },
  { code: 'KL', name: 'Kerala', type: 'state' },
  { code: 'MP', name: 'Madhya Pradesh', type: 'state' },
  { code: 'MH', name: 'Maharashtra', type: 'state' },
  { code: 'MN', name: 'Manipur', type: 'state' },
  { code: 'ML', name: 'Meghalaya', type: 'state' },
  { code: 'MZ', name: 'Mizoram', type: 'state' },
  { code: 'NL', name: 'Nagaland', type: 'state' },
  { code: 'OD', name: 'Odisha', type: 'state' },
  { code: 'PB', name: 'Punjab', type: 'state' },
  { code: 'RJ', name: 'Rajasthan', type: 'state' },
  { code: 'SK', name: 'Sikkim', type: 'state' },
  { code: 'TN', name: 'Tamil Nadu', type: 'state' },
  { code: 'TG', name: 'Telangana', type: 'state' },
  { code: 'TR', name: 'Tripura', type: 'state' },
  { code: 'UP', name: 'Uttar Pradesh', type: 'state' },
  { code: 'UK', name: 'Uttarakhand', type: 'state' },
  { code: 'WB', name: 'West Bengal', type: 'state' },
  // 8 Union Territories
  { code: 'AN', name: 'Andaman and Nicobar Islands', type: 'ut' },
  { code: 'CH', name: 'Chandigarh', type: 'ut' },
  { code: 'DH', name: 'Dadra and Nagar Haveli and Daman and Diu', type: 'ut' },
  { code: 'DL', name: 'Delhi (NCT)', type: 'ut' },
  { code: 'JK', name: 'Jammu and Kashmir', type: 'ut' },
  { code: 'LA', name: 'Ladakh', type: 'ut' },
  { code: 'LD', name: 'Lakshadweep', type: 'ut' },
  { code: 'PY', name: 'Puducherry', type: 'ut' },
]
