using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using WebApp.Models.Common;
using WebApp.Models.DB;
using WebApp.Models.UserTest;

namespace WebApp.Models
{
    public class AuditoryManager : Manager
    {
        public AuditoryManager(Concrete concrete) : base(concrete) { }
        public async Task<IEnumerable<Auditory>> GetAuditoryList(Guid userUID, string localization = "")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<Auditory>(
                    sql: "[dbo].[Administrator_AuditoriumsGet]",
                    new { userUID, localization },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        public async Task<Auditory> GetAuditoryById(Guid userUID, int auditoriumId, string localization = "")
        {
            Auditory aud = new Auditory();
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                aud = await cnt.QueryFirstOrDefaultAsync<Auditory>(sql: "[dbo].[Administrator_AuditoriumGet]", new { userUID, auditoriumId, localization }, commandType: CommandType.StoredProcedure);

                aud.ComputerList = await cnt.QueryAsync<TestComputer>(sql: "[dbo].[Administrator_PlacesGet]", new { userUID, auditoriumId, localization }, commandType: CommandType.StoredProcedure);

            }
            return aud;
        }
        public async Task<IEnumerable<IndexItem>> GetTimes()
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<IndexItem>(sql: "[dbo].[Administrator_Dictionary_TestingTime]", commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<IEnumerable<OrganizationInfo>> GetOrganizationContacts(string localization = "")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<OrganizationInfo>(sql: "[dbo].[OrganizationInfoGet]", new { localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<IEnumerable<ScheduleModel>> GetUserWithTimes(int AuditoriumId, Guid userUID, DateTime? date)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<ScheduleModel>(sql: "[dbo].[Administrator_UserWithScheduleGet]", new { AuditoriumId, userUID, date }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task SetPlaceFree(int placeId, Guid userUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(sql: "[dbo].[Administrator_SetPlaceFree]", new { placeId, userUID }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<Auditory> GetAuditoryByIdForModerate(Guid userUID, int auditoriumId, string localization = "")
        {
            Auditory aud = new Auditory();
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                aud = await cnt.QueryFirstOrDefaultAsync<Auditory>(sql: "[dbo].[Administrator_AuditoriumGet]", new { userUID, auditoriumId, localization }, commandType: CommandType.StoredProcedure);

                List<TestComputer> computers = (await cnt.QueryAsync<TestComputer>(sql: "[dbo].[Administrator_PlacesHasProfileGet]", new { userUID, auditoriumId, localization }, commandType: CommandType.StoredProcedure)).ToList();
                List<TestComputer> comps = new List<TestComputer>();
                foreach (TestComputer item in computers)
                {
                    TestComputer founded = null;
                    foreach (var comp in comps)
                    {
                        founded = comp.Id == item.Id ? comp : founded;
                    }
                    if (founded == null)
                    {
                        comps.Add(item);
                    }
                    else
                    {
                        if (item.TestingStatusId == 2)
                        {
                            comps.Remove(founded);
                            comps.Add(item);
                        }
                    }
                }
                aud.ComputerList = comps;
            }
            return aud;
        }
        public async Task UpdatePlaces(Auditory auditory, Guid userUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(sql: "[dbo].[Administrator_PlacesUpdate]", new StructuredDynamicParameters(new { places = auditory.ComputerList.Select(a => new { ID = a.Id, auditoriumId = auditory.Id, number = a.Name, positionX = a.PositionX, positionY = a.PositionY }).ToArray(), userUID }), commandType: CommandType.StoredProcedure);
                foreach (TestComputer comp in auditory.ComputerList)
                {
                    if (comp.Deleted)
                    {
                        await cnt.ExecuteAsync(sql: "[dbo].[Administrator_PlacesDelete]", new { placeId = comp.Id, userUID }, commandType: CommandType.StoredProcedure);
                    }
                }
            }
        }
        public async Task UpdatePlacesConfig(Auditory auditory, Guid userUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                foreach (TestComputer comp in auditory.ComputerList)
                {
                    await cnt.ExecuteAsync(sql: "[dbo].[Administrator_PlaceProfileWithPinUpdate]", new { placeId = comp.Id, placeProfileId = comp.PlaceProfileId, comp.PIN, userUID }, commandType: CommandType.StoredProcedure);
                }

            }
        }
        public async Task<IEnumerable<PlaceConfigModel>> GetAuditoryCompsWithoutPin(int AuditoryId, Guid userUID, string localization = "")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<PlaceConfigModel>(sql: "[dbo].[Administrator_PlaceProfilesEmptyPinGet]", new { auditoriumId = AuditoryId, userUID, localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task ResetPins(int AuditoryId, Guid userUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(sql: "[dbo].[Administrator_PlaceProfilesEmptyPinSet]", new { auditoriumId = AuditoryId, userUID }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<int> GetProfileByPlaceConfig(string placeConfig, Guid? guid, string localization = "")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryFirstOrDefaultAsync<int>(sql: "[dbo].[Administrator_PlaceProfilePlaceConfigGET]", new { placeConfig, guid, localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task SetUserVerified(int testingProfileId, bool userVerified, Guid? userUID, string localization = "")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(sql: "[dbo].[Administrator_TestingProfileUserVerifiedSet]", new { testingProfileId, userVerified, userUID, localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<ApplicationUser> GetUserPicture(int testingProfileId, Guid? userUID, string localization = "")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryFirstOrDefaultAsync<ApplicationUser>(sql: "[dbo].[UserPlace_UserPictureGet]", new { testingProfileId, userUID, localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<IEnumerable<TestUser>> GetUsersByDateAud(int auditoriumId, int testingStatusId, DateTime? date, Guid userUID, string localization = "")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<TestUser>(sql: "[dbo].[Administrator_UserAuditoriumDateGet]", new { testingStatusId, date, auditoriumId, userUID, localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<IEnumerable<TestUser>> GetUsersByDate(int testingStatusId, DateTime date, Guid userUID, string localization = "")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<TestUser>(sql: "[dbo].[Administrator_UserByDateGet]", new { testingStatusId, date, userUID, localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<IEnumerable<TestResult>> GetUsersResultByDate(int testingStatusId, int? auditoriumId, DateTime? date, Guid userUID, string localization = "")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<TestResult>(sql: "[dbo].[Administrator_TestingResultByDate_Get]", new { testingStatusId, date, auditoriumId, userUID, localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<AuditoryStatistic> GetAuditoryStatistic(int auditoriumId, Guid userUID, string localization = "")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryFirstOrDefaultAsync<AuditoryStatistic>(sql: "[dbo].[Administrator_AuditoriumStatisticsGet]", new { auditoriumId, userUID, localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<dynamic> GetInfoForAdmin(int TestingProfileId, Guid userUID, string localization = "")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<dynamic>(sql: "[dbo].[Administrator_GetInfoAboutUser]", new { TestingProfileId, localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task ResetTest(int TestingProfileId, string localization = "")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(sql: "[dbo].[Administrator_TestingProfileReset]", new { TestingProfileId }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task DeletePreliminary(int TestingProfileId, string localization = "")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(sql: "[dbo].[Debug_DeletePreliminary]", new { TestingProfileId }, commandType: CommandType.StoredProcedure);
            }
        }
        //public async Task<TestUser> GetAuditoryStatistic(int auditoriumId, Guid userUID, string localization = "")
        //{
        //    using (var cnt = await Concrete.OpenConnectionAsync())
        //    {
        //        return await cnt.QueryFirstOrDefaultAsync<TestUser>(sql: "[dbo].[Administrator_UserAuditoriumResultGet]", new { auditoriumId, userUID, localization }, commandType: CommandType.StoredProcedure);
        //    }
        //}
        public async Task UpdatePlaceConfig(PlaceConfigModel config, Guid userUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(sql: "[dbo].[Administrator_PlaceProfileUpdate]", new { placeProfileId = config.Id > 0 ? config.Id : (int?)null, placeConfig = config.PlaceConfig == "" ? (string)null : config.PlaceConfig, placeId = config.PlaceId, userUID }, commandType: CommandType.StoredProcedure);
                if (config.PlaceConfig == null)
                {
                    await cnt.ExecuteAsync(sql: "[dbo].[UserPlace_ResetRequest_Update]", new { placeProfileId = config.Id, userUID, isRequest = 0 }, commandType: CommandType.StoredProcedure);
                }
            }
        }
        public async Task<dynamic> GetPlaceConfig(int pin, Guid? userUID, string localization = "")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                try
                {
                    return await cnt.QueryFirstAsync<TestComputer>(sql: "[dbo].[Administrator_PlaceProfileGet]", new { pin, userUID, localization }, commandType: CommandType.StoredProcedure);
                }
                catch (Exception e)
                {
                    return new
                    {
                        Error = e.Message
                    };
                }
            }
        }
        public async Task<dynamic> GetFreePlaces(Guid? userUID, string localization = "")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                try
                {
                    return await cnt.QueryFirstAsync<PlaceConfigModel>(sql: "[dbo].[UserPlace_PlaceFreeGet]", new { userUID, localization }, commandType: CommandType.StoredProcedure);
                }
                catch (Exception e)
                {
                    return new PlaceConfigModel();
                    //return new { State = 1, e.Message };
                }
            }
        }
        public async Task GetNewPeople(int Id, Guid? userUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(sql: "[dbo].Administrator_UsersAndTestingPofilesForTypeTesting1Load", new { auditoriumId = Id, userUID }, commandType: CommandType.StoredProcedure);

            }
        }
        public async Task<IEnumerable<IndexItem>> GetStatuses(Guid? userUID, string localization = "")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<IndexItem>(sql: "[dbo].[Administrator_TestingStatuseGet]", new { userUID, localization }, commandType: CommandType.StoredProcedure);

            }
        }
        public async Task<TestUser> GetInfoForReport(int testingProfileId, Guid? userUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryFirstOrDefaultAsync<TestUser>(sql: "[dbo].[Administrator_ReportInfoGet]", new { userUID, testingProfileId }, commandType: CommandType.StoredProcedure);

            }
        }
        public async Task<ReportList> GetResultReport(int TestingProfileId, Guid? userUID, string localization = "")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryFirstOrDefaultAsync<ReportList>(sql: "[dbo].[Administrator_TestingProfileResultBlankGet]", new { TestingProfileId, userUID, localization }, commandType: CommandType.StoredProcedure);

            }
        }
        public async Task<IEnumerable<dynamic>> GetUserInfo(int TestingProfileId, Guid? userUID, string localization = "")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<dynamic>(sql: "[dbo].[Administrator_GetUserInfoTestsByTestingProfileId]", new { TestingProfileId, userUID, localization }, commandType: CommandType.StoredProcedure);

            }
        }
        public async Task<int> UpdateStatus(int TestingProfileId, int TestingStatusId, Guid? userUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryFirstOrDefaultAsync<int>(sql: "[dbo].[Administrator_TestingProfile_StatusUpdate]", new { TestingProfileId, userUID, TestingStatusId }, commandType: CommandType.StoredProcedure);

            }
        }
        public async Task UpdatePlaceConfig(int placeId, Guid userUID, string placeConfig = null)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(sql: "Administrator_PlaceProfilePlaceConfigUpdate", new { placeId, userUID, placeConfig }, commandType: CommandType.StoredProcedure);
            }
        }
    }
}