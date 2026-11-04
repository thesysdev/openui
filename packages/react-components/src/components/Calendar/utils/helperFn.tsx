export const getMonthName = (monthNumber: number): string => {
  switch (monthNumber) {
    case 0:
      return "January";
    case 1:
      return "February";
    case 2:
      return "March";
    case 3:
      return "April";
    case 4:
      return "May";
    case 5:
      return "June";
    case 6:
      return "July";
    case 7:
      return "August";
    case 8:
      return "September";
    case 9:
      return "October";
    case 10:
      return "November";
    case 11:
      return "December";
    default:
      return "Invalid Month";
  }
};

export const getMonthNumber = (monthName: string): number => {
  switch (monthName) {
    case "January":
      return 0;
    case "February":
      return 1;
    case "March":
      return 2;
    case "April":
      return 3;
    case "May":
      return 4;
    case "June":
      return 5;
    case "July":
      return 6;
    case "August":
      return 7;
    case "September":
      return 8;
    case "October":
      return 9;
    case "November":
      return 10;
    case "December":
      return 11;
    default:
      return -1;
  }
};
