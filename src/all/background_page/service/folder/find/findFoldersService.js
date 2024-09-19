/**
 * Passbolt ~ Open source password manager for teams
 * Copyright (c) Passbolt SA (https://www.passbolt.com)
 *
 * Licensed under GNU Affero General Public License version 3 of the or any later version.
 * For full copyright and license information, please see the LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright     Copyright (c) Passbolt SA (https://www.passbolt.com)
 * @license       https://opensource.org/licenses/AGPL-3.0 AGPL License
 * @link          https://www.passbolt.com Passbolt(tm)
 * @since         4.9.4
 */


import FolderService from "../../api/folder/folderService";
import FolderLocalStorage from "../../local_storage/folderLocalStorage";
import FoldersCollection from "../../../model/entity/folder/foldersCollection";
import {assertBoolean} from "../../../utils/assertions";

/**
 * The service aims to find folders from the API.
 */
export default class FindFoldersService {
  /**
   *
   * @param {ApiClientOptions} apiClientOptions The api client options
   */
  constructor(apiClientOptions) {
    this.folderService = new FolderService(apiClientOptions);
  }

  /**
   * Retrieve all folders.
   * @param {object} [contains] optional The contain option
   * @param {object} [filters] optional The filters option
   * @param {object} [options] optional The options
   * @returns {Promise<FoldersCollection>}
   */
  async findAll(contains, filters, options) {
    //Assert contains
    const supportedContain = FolderService.getSupportedContainOptions();
    const supportedFilter = FolderService.getSupportedFiltersOptions();

    if (contains && !Object.keys(contains).every(option => supportedContain.includes(option))) {
      throw new Error("Unsupported contains parameter used, please check supported contains");
    }

    if (filters && !Object.keys(filters).every(filter => supportedFilter.includes(filter))) {
      throw new Error("Unsupported filters parameter used, please check supported filters");
    }

    assertBoolean(options?.ignoreInvalidEntity);

    const foldersDto = await this.folderService.findAll(contains, filters);
    return new FoldersCollection(foldersDto, {clone: false, ignoreInvalidEntity: options?.ignoreInvalidEntity});
  }

  /**
   * Retrieve all folders for the local storage.
   * @returns {Promise<FoldersCollection>}
   */
  async findAllForLocalStorage() {
    return this.findAll(FolderLocalStorage.DEFAULT_CONTAIN, null, {ignoreInvalidEntity: true});
  }
}
