// Every dialog a workspace can open (keys for useModal). Each takes its subject in the
// payload, e.g. dialog.open(DIALOGS.editProject, { project }); see WorkspaceDialogs.jsx.
export const DIALOGS = {
  // Projects
  createProject: 'createProject',
  editProject: 'editProject',
  completeProject: 'completeProject',
  abandonProject: 'abandonProject',
  archiveProject: 'archiveProject',
  unarchiveProject: 'unarchiveProject',
  addMember: 'addMember',
  removeMember: 'removeMember',
  // Milestones
  addMilestone: 'addMilestone',
  editMilestone: 'editMilestone',
  deleteMilestone: 'deleteMilestone',
  completeMilestone: 'completeMilestone',
  reviewMilestone: 'reviewMilestone',
  keepOpen: 'keepOpen',
  requestReview: 'requestReview',
  // Users
  createUser: 'createUser',
  editUser: 'editUser',
  transferEmployee: 'transferEmployee',
  resetPassword: 'resetPassword',
  archiveUser: 'archiveUser',
  // Work logs
  logWork: 'logWork',
  addWorkLog: 'addWorkLog',
  correctWorkLog: 'correctWorkLog',
}
