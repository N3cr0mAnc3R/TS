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
        public IEnumerable<Auditory> GetAuditoryList(Guid userUID, string localization = "")
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return cnt.Query<Auditory>(
                    sql: "[dbo].[Administrator_AuditoriumsGet]",
                    new { userUID },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        public Auditory GetAuditoryById(Guid userUID, int auditoriumId)
        {
            Auditory aud = new Auditory();
            using (var cnt = Concrete.OpenConnection())
            {
                aud = cnt.Query<Auditory>(sql: "[dbo].[Administrator_AuditoriumGet]", new { userUID, auditoriumId }, commandType: CommandType.StoredProcedure).FirstOrDefault();

                aud.ComputerList = cnt.Query<TestComputer>(sql: "[dbo].[Administrator_PlacesGet]", new { userUID, auditoriumId }, commandType: CommandType.StoredProcedure);

            }
            return aud;
        }
        public Auditory GetAuditoryByIdForModerate(Guid userUID, int auditoriumId)
        {
            Auditory aud = new Auditory();
            using (var cnt = Concrete.OpenConnection())
            {
                aud = cnt.Query<Auditory>(sql: "[dbo].[Administrator_AuditoriumGet]", new { userUID, auditoriumId }, commandType: CommandType.StoredProcedure).FirstOrDefault();

                aud.ComputerList = cnt.Query<TestComputer>(sql: "[dbo].[Administrator_PlacesHasProfileGet]", new { userUID, auditoriumId }, commandType: CommandType.StoredProcedure);

            }
            return aud;
        }
        public void UpdatePlaces(Auditory auditory, Guid userUID)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                cnt.Execute(sql: "[dbo].[Administrator_PlacesUpdate]", new StructuredDynamicParameters(new { places = auditory.ComputerList.Select(a => new { ID = a.Id, auditoriumId = auditory.Id, number = a.Name, positionX = a.PositionX, positionY = a.PositionY }).ToArray(), userUID }), commandType: CommandType.StoredProcedure);
                foreach (TestComputer comp in auditory.ComputerList)
                {
                    if (comp.Deleted)
                    {
                        cnt.Execute(sql: "[dbo].[Administrator_PlacesDelete]", new { placeId = comp.Id, userUID }, commandType: CommandType.StoredProcedure);
                    }
                }
            }
        }
        public void UpdatePlacesConfig(Auditory auditory, Guid userUID)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                foreach (TestComputer comp in auditory.ComputerList)
                {
                    cnt.Execute(sql: "[dbo].[Administrator_PlaceProfileWithPinUpdate]", new { placeId = comp.Id, placeProfileId = comp.PlaceProfileId, comp.PIN, userUID }, commandType: CommandType.StoredProcedure);
                }

            }
        }
        public async Task<IEnumerable<PlaceConfigModel>> GetAuditoryCompsWithoutPin(int AuditoryId, Guid userUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<PlaceConfigModel>(sql: "[dbo].[Administrator_PlaceProfilesEmptyPinGet]", new { auditoriumId = AuditoryId, userUID }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task ResetPins(int AuditoryId, Guid userUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(sql: "[dbo].[Administrator_PlaceProfilesEmptyPinSet]", new { auditoriumId = AuditoryId, userUID }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<int> GetProfileByPlaceConfig(string placeConfig, Guid guid)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryFirstOrDefaultAsync<int>(sql: "[dbo].[Administrator_PlaceProfilePlaceConfigGET]", new { placeConfig, guid }, commandType: CommandType.StoredProcedure);
            }
        }
        public void UpdatePlaceConfig(PlaceConfigModel config, Guid userUID)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                cnt.Execute(sql: "[dbo].[Administrator_PlaceProfileUpdate]", new { placeProfileId = config.Id > 0 ? config.Id : (int?)null, placeConfig = config.PlaceConfig, placeId = config.PlaceId, userUID }, commandType: CommandType.StoredProcedure);
            }
        }
        public dynamic GetPlaceConfig(int pin, Guid userUID)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                try
                {
                    return cnt.QueryFirst<TestComputer>(sql: "[dbo].[Administrator_PlaceProfileGet]", new { pin, userUID }, commandType: CommandType.StoredProcedure);
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
        public async Task<PlaceConfigModel> GetFreePlaces(Guid? userUID)
        {
            using (var cnt =await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryFirstAsync<PlaceConfigModel>(sql: "[dbo].[UserPlace_PlaceFreeGet]", new { userUID }, commandType: CommandType.StoredProcedure);

            }
        }
        public void UpdatePlaceConfig(int placeId, Guid userUID, string placeConfig)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                cnt.Execute(sql: "Administrator_PlaceProfilePlaceConfigUpdate", new { placeId, userUID, placeConfig }, commandType: CommandType.StoredProcedure);
            }
        }
    }
}