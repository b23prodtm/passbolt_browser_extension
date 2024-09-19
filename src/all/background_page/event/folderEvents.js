/**
 * Folder events
 *
 * @copyright (c) 2019 Passbolt SA
 * @licence GNU Affero General Public License http://www.gnu.org/licenses/agpl-3.0.en.html
 */
import FolderModel from "../model/folder/folderModel";
import FolderCreateController from "../controller/folder/folderCreateController";
import MoveController from "../controller/move/moveController";
import FolderEntity from "../model/entity/folder/folderEntity";
import UpdateResourcesLocalStorageService from "../service/resource/updateResourcesLocalStorageService";
import UpdateAllFolderLocalStorageController
  from "../controller/folderLocalStorage/updateAllFoldersLocalStorageController";

/**
 * Listens to the folder events
 * @param {Worker} worker The worker
 * @param {ApiClientOptions} apiClientOptions The
 * api client options
 * @param {AccountEntity} account The account
 */
const listen = function(worker, apiClientOptions, account) {
  /*
   * Create a new folder
   *
   * @listens passbolt.folders.create
   * @param requestId {uuid} The request identifier
   * @param folder {array} The folder
   */
  worker.port.on('passbolt.folders.create', async(requestId, folderDto) => {
    try {
      const folderCreateController = new FolderCreateController(worker, requestId, apiClientOptions, account);
      const folderEntity = await folderCreateController.main(new FolderEntity(folderDto));
      worker.port.emit(requestId, 'SUCCESS', folderEntity);
    } catch (error) {
      worker.port.emit(requestId, 'ERROR', error);
    }
  });

  /*
   * Update a folder
   *
   * @listens passbolt.folders.update
   * @param requestId {uuid} The request identifier
   * @param folder {array} The folder
   */
  worker.port.on('passbolt.folders.update', async(requestId, folderDto) => {
    try {
      const folderModel = new FolderModel(apiClientOptions, account);
      const folderEntity = await folderModel.update(new FolderEntity(folderDto));
      worker.port.emit(requestId, 'SUCCESS', folderEntity);
    } catch (error) {
      worker.port.emit(requestId, 'ERROR', error);
    }
  });

  /*
   * delete a folder
   *
   * @listens passbolt.folders.delete
   * @param requestId {uuid} The request identifier
   * @param folder {array} The folder
   */
  worker.port.on('passbolt.folders.delete', async(requestId, folderId, cascade) => {
    try {
      const folderModel = new FolderModel(apiClientOptions, account);
      const updateResourcesLocalStorage = new UpdateResourcesLocalStorageService(account, apiClientOptions);

      await folderModel.delete(folderId, cascade);
      await updateResourcesLocalStorage.updateAll();

      worker.port.emit(requestId, 'SUCCESS', folderId);
    } catch (error) {
      worker.port.emit(requestId, 'ERROR', error);
    }
  });

  /*
   * Pull the resources from the API and update the local storage.
   *
   * @listens passbolt.app.folders.update-local-storage
   * @param {uuid} requestId The request identifier
   */
  worker.port.on('passbolt.folders.update-local-storage', async requestId => {
    const controller = new UpdateAllFolderLocalStorageController(worker, requestId, apiClientOptions, account);
    await controller._exec();
  });

  /*
   * Open the folder move confirmation dialog.
   *
   * @listens passbolt.folders.open-move-confirmation-dialog
   * @param {object} moveDto {resources: array of uuids, folders: array of uuids, folderParentId: uuid}
   */
  worker.port.on('passbolt.folders.open-move-confirmation-dialog', async(requestId, moveDto) => {
    try {
      const controller = new MoveController(worker, requestId, apiClientOptions, account);
      await controller.main(moveDto);
      worker.port.emit(requestId, 'SUCCESS');
    } catch (error) {
      worker.port.emit(requestId, 'ERROR', error);
    }
  });
};

export const FolderEvents = {listen};
