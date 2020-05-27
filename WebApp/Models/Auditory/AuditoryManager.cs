using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using WebApp.Models.DB;

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
        public async Task<Auditory> GetAuditoryByIdForModerate(Guid userUID, int auditoriumId, string localization = "")
        {
            Auditory aud = new Auditory();
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                aud = await cnt.QueryFirstOrDefaultAsync<Auditory>(sql: "[dbo].[Administrator_AuditoriumGet]", new { userUID, auditoriumId, localization }, commandType: CommandType.StoredProcedure);

                aud.ComputerList = await cnt.QueryAsync<TestComputer>(sql: "[dbo].[Administrator_PlacesHasProfileGet]", new { userUID, auditoriumId, localization }, commandType: CommandType.StoredProcedure);

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
        public async Task<int> GetProfileByPlaceConfig(string placeConfig, Guid guid, string localization = "")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryFirstOrDefaultAsync<int>(sql: "[dbo].[Administrator_PlaceProfilePlaceConfigGET]", new { placeConfig, guid, localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task UpdatePlaceConfig(PlaceConfigModel config, Guid userUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(sql: "[dbo].[Administrator_PlaceProfileUpdate]", new { placeProfileId = config.Id > 0 ? config.Id : (int?)null, placeConfig = config.PlaceConfig, placeId = config.PlaceId, userUID }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<dynamic> GetPlaceConfig(int pin, Guid userUID, string localization = "")
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
        public async Task<PlaceConfigModel> GetFreePlaces(Guid? userUID, string localization = "")
        {
            using (var cnt =await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryFirstAsync<PlaceConfigModel>(sql: "[dbo].[UserPlace_PlaceFreeGet]", new { userUID, localization }, commandType: CommandType.StoredProcedure);

            }
        }
        public async Task UpdatePlaceConfig(int placeId, Guid userUID, string placeConfig)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(sql: "Administrator_PlaceProfilePlaceConfigUpdate", new { placeId, userUID, placeConfig }, commandType: CommandType.StoredProcedure);
            }
        }
    }
}