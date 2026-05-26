export const fetchCompanyProfile = async () => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    companyName: 'Testing Company',
    companyLogo: 'TC', // Could be an image URL in a real scenario
    userName: 'Testing Team',
    userInitials: 'TE',
  };
};
